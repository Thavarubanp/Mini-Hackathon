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
    public class DoctorsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DoctorsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/doctors
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<DoctorResponseDto>>> GetAll(
            [FromQuery] int? hospitalId,
            [FromQuery] string? specialization,
            [FromQuery] string? search)
        {
            var query = _context.Doctors
                .Include(d => d.Hospital)
                .AsQueryable();

            if (hospitalId.HasValue && hospitalId.Value > 0)
            {
                query = query.Where(d => d.HospitalId == hospitalId.Value);
            }

            if (!string.IsNullOrWhiteSpace(specialization))
            {
                var spec = specialization.Trim().ToLower();
                query = query.Where(d => d.Specialization.ToLower().Contains(spec));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(d => d.FullName.ToLower().Contains(term) ||
                                         d.Specialization.ToLower().Contains(term) ||
                                         d.Hospital.Name.ToLower().Contains(term));
            }

            var doctors = await query
                .Select(d => new DoctorResponseDto
                {
                    Id = d.Id,
                    FullName = d.FullName,
                    Specialization = d.Specialization,
                    AvailableDay = d.AvailableDay,
                    AvailableStartTime = d.AvailableStartTime.ToString("HH:mm"),
                    AvailableEndTime = d.AvailableEndTime.ToString("HH:mm"),
                    HospitalId = d.HospitalId,
                    HospitalName = d.Hospital != null ? d.Hospital.Name : string.Empty
                })
                .ToListAsync();

            return Ok(doctors);
        }

        // GET: api/doctors/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<DoctorResponseDto>> GetById(int id)
        {
            var doctor = await _context.Doctors
                .Include(d => d.Hospital)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (doctor == null)
            {
                return NotFound(new { message = $"Doctor with ID {id} not found." });
            }

            var responseDto = new DoctorResponseDto
            {
                Id = doctor.Id,
                FullName = doctor.FullName,
                Specialization = doctor.Specialization,
                AvailableDay = doctor.AvailableDay,
                AvailableStartTime = doctor.AvailableStartTime.ToString("HH:mm"),
                AvailableEndTime = doctor.AvailableEndTime.ToString("HH:mm"),
                HospitalId = doctor.HospitalId,
                HospitalName = doctor.Hospital != null ? doctor.Hospital.Name : string.Empty
            };

            return Ok(responseDto);
        }

        // POST: api/doctors
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DoctorResponseDto>> Create([FromBody] DoctorCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate Hospital exists
            var hospital = await _context.Hospitals.FindAsync(dto.HospitalId);
            if (hospital == null)
            {
                return BadRequest(new { message = $"Hospital with ID {dto.HospitalId} does not exist." });
            }

            // Parse Time
            if (!TimeOnly.TryParse(dto.AvailableStartTime, out var startTime))
            {
                return BadRequest(new { message = "Invalid AvailableStartTime format. Expected HH:mm (e.g. 09:00)." });
            }

            if (!TimeOnly.TryParse(dto.AvailableEndTime, out var endTime))
            {
                return BadRequest(new { message = "Invalid AvailableEndTime format. Expected HH:mm (e.g. 17:00)." });
            }

            if (endTime <= startTime)
            {
                return BadRequest(new { message = "AvailableEndTime must be after AvailableStartTime." });
            }

            var doctor = new Doctor
            {
                FullName = dto.FullName.Trim(),
                Specialization = dto.Specialization.Trim(),
                AvailableDay = dto.AvailableDay.Trim(),
                AvailableStartTime = startTime,
                AvailableEndTime = endTime,
                HospitalId = dto.HospitalId
            };

            await _context.Doctors.AddAsync(doctor);
            await _context.SaveChangesAsync();

            var responseDto = new DoctorResponseDto
            {
                Id = doctor.Id,
                FullName = doctor.FullName,
                Specialization = doctor.Specialization,
                AvailableDay = doctor.AvailableDay,
                AvailableStartTime = doctor.AvailableStartTime.ToString("HH:mm"),
                AvailableEndTime = doctor.AvailableEndTime.ToString("HH:mm"),
                HospitalId = doctor.HospitalId,
                HospitalName = hospital.Name
            };

            return CreatedAtAction(nameof(GetById), new { id = doctor.Id }, responseDto);
        }

        // PUT: api/doctors/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Doctor")]
        public async Task<ActionResult<DoctorResponseDto>> Update(int id, [FromBody] DoctorUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Admin can update any doctor. A Doctor can update only their own profile.
            if (!User.IsInRole("Admin"))
            {
                var doctorIdClaim = User.FindFirst("doctorId")?.Value
                    ?? User.FindFirst(c => c.Type.Equals("doctorId", StringComparison.OrdinalIgnoreCase))?.Value;

                if (string.IsNullOrEmpty(doctorIdClaim) || !int.TryParse(doctorIdClaim, out var claimDoctorId) || claimDoctorId != id)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: Doctors can only update their own profile." });
                }
            }

            var doctor = await _context.Doctors
                .Include(d => d.Hospital)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (doctor == null)
            {
                return NotFound(new { message = $"Doctor with ID {id} not found." });
            }

            // Validate Hospital exists
            var hospital = await _context.Hospitals.FindAsync(dto.HospitalId);
            if (hospital == null)
            {
                return BadRequest(new { message = $"Hospital with ID {dto.HospitalId} does not exist." });
            }

            // Parse Time
            if (!TimeOnly.TryParse(dto.AvailableStartTime, out var startTime))
            {
                return BadRequest(new { message = "Invalid AvailableStartTime format. Expected HH:mm (e.g. 09:00)." });
            }

            if (!TimeOnly.TryParse(dto.AvailableEndTime, out var endTime))
            {
                return BadRequest(new { message = "Invalid AvailableEndTime format. Expected HH:mm (e.g. 17:00)." });
            }

            if (endTime <= startTime)
            {
                return BadRequest(new { message = "AvailableEndTime must be after AvailableStartTime." });
            }

            doctor.FullName = dto.FullName.Trim();
            doctor.Specialization = dto.Specialization.Trim();
            doctor.AvailableDay = dto.AvailableDay.Trim();
            doctor.AvailableStartTime = startTime;
            doctor.AvailableEndTime = endTime;
            doctor.HospitalId = dto.HospitalId;

            await _context.SaveChangesAsync();

            var responseDto = new DoctorResponseDto
            {
                Id = doctor.Id,
                FullName = doctor.FullName,
                Specialization = doctor.Specialization,
                AvailableDay = doctor.AvailableDay,
                AvailableStartTime = doctor.AvailableStartTime.ToString("HH:mm"),
                AvailableEndTime = doctor.AvailableEndTime.ToString("HH:mm"),
                HospitalId = doctor.HospitalId,
                HospitalName = hospital.Name
            };

            return Ok(responseDto);
        }

        // DELETE: api/doctors/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var doctor = await _context.Doctors.FindAsync(id);

            if (doctor == null)
            {
                return NotFound(new { message = $"Doctor with ID {id} not found." });
            }

            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
