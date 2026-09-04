using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PatientsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // ── GET /api/patients ───────────────────────────────────────────────────
    /// <summary>
    /// Get all patients. Admin only.
    /// Supports optional query params: ?search=&lt;name/district&gt; and ?nic=&lt;nic&gt;
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<PatientResponseDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? nic)
    {
        var query = _db.Patients.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(nic))
        {
            query = query.Where(p => p.NIC == nic);
        }
        else if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p =>
                p.FullName.ToLower().Contains(term) ||
                p.District.ToLower().Contains(term));
        }

        var patients = await query
            .Select(p => new PatientResponseDto
            {
                Id        = p.Id,
                FullName  = p.FullName,
                NIC       = p.NIC,
                PhoneNumber = p.PhoneNumber,
                District  = p.District
            })
            .ToListAsync();

        return Ok(patients);
    }

    // ── GET /api/patients/{id} ──────────────────────────────────────────────
    /// <summary>
    /// Get a single patient by ID.
    /// Admin can access any patient. Other authenticated users can access any patient.
    /// (RBAC to be tightened once shared User/Role architecture is finalized.)
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientResponseDto>> GetById(int id)
    {
        var patient = await _db.Patients
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PatientResponseDto
            {
                Id          = p.Id,
                FullName    = p.FullName,
                NIC         = p.NIC,
                PhoneNumber = p.PhoneNumber,
                District    = p.District
            })
            .FirstOrDefaultAsync();

        if (patient is null)
            return NotFound(new { message = $"Patient with ID {id} was not found." });

        return Ok(patient);
    }

    // ── POST /api/patients ──────────────────────────────────────────────────
    /// <summary>
    /// Create a patient profile.
    /// (Patient-specific ownership checks will be added once shared auth is finalized.)
    /// Integration dependency: shared User/Role architecture must provide patientId JWT claim.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PatientResponseDto>> Create([FromBody] PatientCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Application-level NIC uniqueness check
        if (await _db.Patients.AnyAsync(p => p.NIC == dto.NIC))
            return Conflict(new { message = "A patient with this NIC already exists." });

        var patient = new Patient
        {
            FullName    = dto.FullName,
            NIC         = dto.NIC,
            PhoneNumber = dto.PhoneNumber,
            District    = dto.District
        };

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();

        var response = new PatientResponseDto
        {
            Id          = patient.Id,
            FullName    = patient.FullName,
            NIC         = patient.NIC,
            PhoneNumber = patient.PhoneNumber,
            District    = patient.District
        };

        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, response);
    }

    // ── PUT /api/patients/{id} ──────────────────────────────────────────────
    /// <summary>
    /// Update a patient profile.
    /// Admin: any patient. Ownership check to be added once shared auth is finalized.
    /// Integration dependency: shared User/Role architecture must provide patientId JWT claim.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PatientUpdateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var patient = await _db.Patients.FindAsync(id);
        if (patient is null)
            return NotFound(new { message = $"Patient with ID {id} was not found." });

        // NIC uniqueness check when NIC is being changed
        if (patient.NIC != dto.NIC &&
            await _db.Patients.AnyAsync(p => p.NIC == dto.NIC && p.Id != id))
        {
            return Conflict(new { message = "A patient with this NIC already exists." });
        }

        patient.FullName    = dto.FullName;
        patient.NIC         = dto.NIC;
        patient.PhoneNumber = dto.PhoneNumber;
        patient.District    = dto.District;

        await _db.SaveChangesAsync();

        return Ok(new PatientResponseDto
        {
            Id          = patient.Id,
            FullName    = patient.FullName,
            NIC         = patient.NIC,
            PhoneNumber = patient.PhoneNumber,
            District    = patient.District
        });
    }

    // ── DELETE /api/patients/{id} ───────────────────────────────────────────
    /// <summary>
    /// Delete a patient record. Admin only.
    /// If Appointment FK is added later, the Leader should add cascade/restrict handling.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var patient = await _db.Patients.FindAsync(id);
        if (patient is null)
            return NotFound(new { message = $"Patient with ID {id} was not found." });

        _db.Patients.Remove(patient);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
