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
    public class HospitalsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HospitalsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/hospitals
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<HospitalResponseDto>>> GetAll()
        {
            var hospitals = await _context.Hospitals
                .Select(h => new HospitalResponseDto
                {
                    Id = h.Id,
                    Name = h.Name,
                    District = h.District,
                    Address = h.Address,
                    ContactNumber = h.ContactNumber
                })
                .ToListAsync();

            return Ok(hospitals);
        }

        // GET: api/hospitals/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<HospitalResponseDto>> GetById(int id)
        {
            var hospital = await _context.Hospitals.FindAsync(id);

            if (hospital == null)
            {
                return NotFound(new { message = $"Hospital with ID {id} not found." });
            }

            var responseDto = new HospitalResponseDto
            {
                Id = hospital.Id,
                Name = hospital.Name,
                District = hospital.District,
                Address = hospital.Address,
                ContactNumber = hospital.ContactNumber
            };

            return Ok(responseDto);
        }

        // POST: api/hospitals
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<HospitalResponseDto>> Create([FromBody] HospitalCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var hospital = new Hospital
            {
                Name = dto.Name.Trim(),
                District = dto.District.Trim(),
                Address = dto.Address.Trim(),
                ContactNumber = dto.ContactNumber.Trim()
            };

            await _context.Hospitals.AddAsync(hospital);
            await _context.SaveChangesAsync();

            var responseDto = new HospitalResponseDto
            {
                Id = hospital.Id,
                Name = hospital.Name,
                District = hospital.District,
                Address = hospital.Address,
                ContactNumber = hospital.ContactNumber
            };

            return CreatedAtAction(nameof(GetById), new { id = hospital.Id }, responseDto);
        }

        // PUT: api/hospitals/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<HospitalResponseDto>> Update(int id, [FromBody] HospitalUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var hospital = await _context.Hospitals.FindAsync(id);

            if (hospital == null)
            {
                return NotFound(new { message = $"Hospital with ID {id} not found." });
            }

            hospital.Name = dto.Name.Trim();
            hospital.District = dto.District.Trim();
            hospital.Address = dto.Address.Trim();
            hospital.ContactNumber = dto.ContactNumber.Trim();

            await _context.SaveChangesAsync();

            var responseDto = new HospitalResponseDto
            {
                Id = hospital.Id,
                Name = hospital.Name,
                District = hospital.District,
                Address = hospital.Address,
                ContactNumber = hospital.ContactNumber
            };

            return Ok(responseDto);
        }

        // DELETE: api/hospitals/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var hospital = await _context.Hospitals.FindAsync(id);

            if (hospital == null)
            {
                return NotFound(new { message = $"Hospital with ID {id} not found." });
            }

            try
            {
                _context.Hospitals.Remove(hospital);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { message = "Hospital cannot be deleted while doctors or other records are assigned to it." });
            }
        }
    }
}
