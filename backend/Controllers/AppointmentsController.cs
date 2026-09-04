using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuwaSewa.Api.Data;      // adjust namespace to match your actual DbContext location
using SuwaSewa.Api.DTOs;
using SuwaSewa.Api.Models;

namespace SuwaSewa.Api.Controllers
{
    [ApiController]
    [Route("api/appointments")]
    [Authorize] // every action requires a logged-in user; specific roles tightened per-action
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AppointmentsController(AppDbContext db)
        {
            _db = db;
        }

        // ---------- Claim helpers ----------

        private string? GetRole() => User.FindFirst(ClaimTypes.Role)?.Value
                                      ?? User.FindFirst("role")?.Value;

        private int? GetTokenPatientId()
        {
            var v = User.FindFirst("patientId")?.Value;
            return int.TryParse(v, out var id) ? id : null;
        }

        private int? GetTokenDoctorId()
        {
            var v = User.FindFirst("doctorId")?.Value;
            return int.TryParse(v, out var id) ? id : null;
        }

        private bool IsAdmin() => GetRole() == "Admin";

        // ---------- Mapping ----------

        private static AppointmentDto ToDto(Appointment a) => new()
        {
            Id = a.Id,
            PatientId = a.PatientId,
            PatientName = a.Patient?.FullName ?? "",
            DoctorId = a.DoctorId,
            DoctorName = a.Doctor?.FullName ?? "",
            Specialization = a.Doctor?.Specialization ?? "",
            AppointmentDate = a.AppointmentDate,
            AppointmentTime = a.AppointmentTime,
            Reason = a.Reason,
            QueueNumber = a.QueueNumber,
            Status = a.Status
        };

        private IQueryable<Appointment> BaseQuery() =>
            _db.Appointments.Include(a => a.Patient).Include(a => a.Doctor);

        // ---------- GET /api/appointments  (Admin only, optional ?status= & ?date=) ----------
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] DateTime? date)
        {
            var query = BaseQuery();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(a => a.Status == status);

            if (date.HasValue)
                query = query.Where(a => a.AppointmentDate.Date == date.Value.Date);

            var results = await query.OrderByDescending(a => a.AppointmentDate).ToListAsync();
            return Ok(results.Select(ToDto));
        }

        // ---------- GET /api/appointments/{id}  (ownership check) ----------
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var appt = await BaseQuery().FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return NotFound();

            if (!IsAdmin())
            {
                var role = GetRole();
                if (role == "Patient" && appt.PatientId != GetTokenPatientId()) return Forbid();
                if (role == "Doctor" && appt.DoctorId != GetTokenDoctorId()) return Forbid();
            }

            return Ok(ToDto(appt));
        }

        // ---------- GET /api/appointments/patient/{patientId}  (own only) ----------
        [HttpGet("patient/{patientId}")]
        [Authorize(Roles = "Patient,Admin")]
        public async Task<IActionResult> GetByPatient(int patientId)
        {
            if (!IsAdmin() && GetTokenPatientId() != patientId) return Forbid();

            var results = await BaseQuery()
                .Where(a => a.PatientId == patientId)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            return Ok(results.Select(ToDto));
        }

        // ---------- GET /api/appointments/doctor/{doctorId}  (own only — rule 6.4) ----------
        [HttpGet("doctor/{doctorId}")]
        [Authorize(Roles = "Doctor,Admin")]
        public async Task<IActionResult> GetByDoctor(int doctorId, [FromQuery] string? status)
        {
            // The core rule: role alone is not enough. A doctor's token doctorId
            // must match the doctorId being requested, or it's a 403, not an
            // empty/filtered list.
            if (!IsAdmin() && GetTokenDoctorId() != doctorId) return Forbid();

            var query = BaseQuery().Where(a => a.DoctorId == doctorId);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(a => a.Status == status);

            var results = await query.OrderBy(a => a.AppointmentDate).ThenBy(a => a.QueueNumber).ToListAsync();
            return Ok(results.Select(ToDto));
        }

        // ---------- POST /api/appointments ----------
        [HttpPost]
        [Authorize(Roles = "Patient,Admin")]
        public async Task<IActionResult> Create([FromBody] AppointmentCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Resolve the booking patient: patients always book for themselves;
            // only Admin may specify a different PatientId.
            int patientId;
            if (GetRole() == "Patient")
            {
                patientId = GetTokenPatientId() ?? 0;
            }
            else
            {
                if (dto.PatientId is null or 0)
                    return BadRequest(new { message = "PatientId is required for admin bookings" });
                patientId = dto.PatientId.Value;
            }

            var patientExists = await _db.Patients.AnyAsync(p => p.Id == patientId);
            if (!patientExists) return BadRequest(new { message = "Patient does not exist" });

            var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == dto.DoctorId);
            if (doctor == null) return BadRequest(new { message = "Doctor does not exist" });

            if (dto.AppointmentDate.Date < DateTime.UtcNow.Date)
                return BadRequest(new { message = "Appointment date cannot be in the past" });

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Reason is required" });

            var duplicate = await _db.Appointments.AnyAsync(a =>
                a.DoctorId == dto.DoctorId &&
                a.AppointmentDate.Date == dto.AppointmentDate.Date &&
                a.AppointmentTime == dto.AppointmentTime &&
                a.Status != "Cancelled");
            if (duplicate)
                return Conflict(new { message = "This doctor already has a booking at that date and time" });

            // Auto-generate sequential queue number per doctor per day.
            var queueNumber = await _db.Appointments
                .Where(a => a.DoctorId == dto.DoctorId && a.AppointmentDate.Date == dto.AppointmentDate.Date)
                .CountAsync() + 1;

            var appointment = new Appointment
            {
                PatientId = patientId,
                DoctorId = dto.DoctorId,
                AppointmentDate = dto.AppointmentDate.Date,
                AppointmentTime = dto.AppointmentTime,
                Reason = dto.Reason,
                QueueNumber = queueNumber,
                Status = "Pending"
            };

            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync();

            var saved = await BaseQuery().FirstAsync(a => a.Id == appointment.Id);
            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, ToDto(saved));
        }

        // ---------- PUT /api/appointments/{id}  (ownership check, edit own booking) ----------
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AppointmentUpdateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return NotFound();

            if (!IsAdmin())
            {
                var role = GetRole();
                if (role == "Patient" && appt.PatientId != GetTokenPatientId()) return Forbid();
                if (role == "Doctor" && appt.DoctorId != GetTokenDoctorId()) return Forbid();
            }

            var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == dto.DoctorId);
            if (doctor == null) return BadRequest(new { message = "Doctor does not exist" });

            if (dto.AppointmentDate.Date < DateTime.UtcNow.Date)
                return BadRequest(new { message = "Appointment date cannot be in the past" });

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Reason is required" });

            var duplicate = await _db.Appointments.AnyAsync(a =>
                a.Id != id &&
                a.DoctorId == dto.DoctorId &&
                a.AppointmentDate.Date == dto.AppointmentDate.Date &&
                a.AppointmentTime == dto.AppointmentTime &&
                a.Status != "Cancelled");
            if (duplicate)
                return Conflict(new { message = "This doctor already has a booking at that date and time" });

            appt.DoctorId = dto.DoctorId;
            appt.AppointmentDate = dto.AppointmentDate.Date;
            appt.AppointmentTime = dto.AppointmentTime;
            appt.Reason = dto.Reason;

            await _db.SaveChangesAsync();
            var saved = await BaseQuery().FirstAsync(a => a.Id == appt.Id);
            return Ok(ToDto(saved));
        }

        // ---------- PUT /api/appointments/{id}/status  (Doctor/Admin, own only) ----------
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Doctor,Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] AppointmentStatusUpdateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return NotFound();

            if (!IsAdmin() && appt.DoctorId != GetTokenDoctorId()) return Forbid();

            appt.Status = dto.Status;
            await _db.SaveChangesAsync();

            var saved = await BaseQuery().FirstAsync(a => a.Id == appt.Id);
            return Ok(ToDto(saved));
        }

        // ---------- DELETE /api/appointments/{id}  (ownership check) ----------
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return NotFound();

            if (!IsAdmin())
            {
                var role = GetRole();
                if (role == "Patient" && appt.PatientId != GetTokenPatientId()) return Forbid();
                if (role == "Doctor" && appt.DoctorId != GetTokenDoctorId()) return Forbid();
            }

            _db.Appointments.Remove(appt);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
