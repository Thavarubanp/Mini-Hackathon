using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AppointmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/appointments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppointmentResponseDto>>> GetAll(
            [FromQuery] int? doctorId,
            [FromQuery] int? patientId,
            [FromQuery] int? hospitalId,
            [FromQuery] string? status)
        {
            var query = _context.Appointments.AsQueryable();

            if (doctorId.HasValue) query = query.Where(a => a.DoctorId == doctorId.Value);
            if (patientId.HasValue) query = query.Where(a => a.PatientId == patientId.Value);
            if (hospitalId.HasValue) query = query.Where(a => a.HospitalId == hospitalId.Value);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(a => a.Status == status);

            var appointments = await query
                .OrderByDescending(a => a.AppointmentDate)
                .ThenBy(a => a.QueueNumber)
                .Select(a => new AppointmentResponseDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId,
                    PatientName = a.PatientName,
                    PatientPhone = a.PatientPhone,
                    DoctorId = a.DoctorId,
                    DoctorName = a.DoctorName,
                    HospitalId = a.HospitalId,
                    HospitalName = a.HospitalName,
                    AppointmentDate = a.AppointmentDate,
                    QueueNumber = a.QueueNumber,
                    Status = a.Status,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // GET: api/appointments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AppointmentResponseDto>> GetById(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound(new { message = $"Appointment with ID {id} not found." });
            }

            return Ok(new AppointmentResponseDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                PatientName = appointment.PatientName,
                PatientPhone = appointment.PatientPhone,
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.DoctorName,
                HospitalId = appointment.HospitalId,
                HospitalName = appointment.HospitalName,
                AppointmentDate = appointment.AppointmentDate,
                QueueNumber = appointment.QueueNumber,
                Status = appointment.Status,
                CreatedAt = appointment.CreatedAt
            });
        }

        // POST: api/appointments
        [HttpPost]
        public async Task<ActionResult<AppointmentResponseDto>> Create([FromBody] AppointmentCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Look up or Auto-Create Patient record to satisfy Foreign Key
            var patient = await _context.Patients.FirstOrDefaultAsync(p => 
                p.FullName.ToLower() == dto.PatientName.Trim().ToLower() && 
                p.PhoneNumber == dto.PatientPhone.Trim());

            if (patient == null)
            {
                patient = new Patient
                {
                    FullName = dto.PatientName.Trim(),
                    PhoneNumber = dto.PatientPhone.Trim(),
                    NIC = "V" + DateTime.UtcNow.Ticks.ToString().Substring(10),
                    District = "General"
                };
                await _context.Patients.AddAsync(patient);
                await _context.SaveChangesAsync();
            }

            // Look up Doctor and Hospital names
            string doctorName = dto.DoctorName;
            var doc = await _context.Doctors.FindAsync(dto.DoctorId);
            if (doc != null)
            {
                doctorName = doc.FullName;
            }

            string hospitalName = dto.HospitalName;
            var hosp = await _context.Hospitals.FindAsync(dto.HospitalId);
            if (hosp != null)
            {
                hospitalName = hosp.Name;
            }

            // Auto-calculate Queue Number for this Doctor on this date
            var dateOnly = dto.AppointmentDate.Date;
            var maxQueue = await _context.Appointments
                .Where(a => a.DoctorId == dto.DoctorId && a.AppointmentDate.Date == dateOnly)
                .Select(a => (int?)a.QueueNumber)
                .MaxAsync() ?? 0;

            int nextQueueNumber = maxQueue + 1;

            var appointment = new Appointment
            {
                PatientId = patient.Id,
                PatientName = dto.PatientName.Trim(),
                PatientPhone = dto.PatientPhone.Trim(),
                DoctorId = dto.DoctorId,
                DoctorName = string.IsNullOrWhiteSpace(doctorName) ? "Doctor" : doctorName.Trim(),
                HospitalId = dto.HospitalId,
                HospitalName = string.IsNullOrWhiteSpace(hospitalName) ? "Hospital" : hospitalName.Trim(),
                AppointmentDate = dto.AppointmentDate,
                QueueNumber = nextQueueNumber,
                Status = "Confirmed",
                CreatedAt = DateTime.UtcNow
            };

            await _context.Appointments.AddAsync(appointment);
            await _context.SaveChangesAsync();

            var response = new AppointmentResponseDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                PatientName = appointment.PatientName,
                PatientPhone = appointment.PatientPhone,
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.DoctorName,
                HospitalId = appointment.HospitalId,
                HospitalName = appointment.HospitalName,
                AppointmentDate = appointment.AppointmentDate,
                QueueNumber = appointment.QueueNumber,
                Status = appointment.Status,
                CreatedAt = appointment.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, response);
        }

        // PUT: api/appointments/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] AppointmentStatusUpdateDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound(new { message = $"Appointment with ID {id} not found." });
            }

            appointment.Status = dto.Status.Trim();
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Appointment #{id} status updated to {appointment.Status}." });
        }

        // DELETE: api/appointments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound(new { message = $"Appointment with ID {id} not found." });
            }

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
