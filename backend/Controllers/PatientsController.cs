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
[Authorize]  // All endpoints require authentication; individual endpoints tighten further.
public class PatientsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PatientsController(AppDbContext db)
    {
        _db = db;
    }

    // ── GET /api/patients ──────────────────────────────────────────────────
    /// <summary>
    /// Get all patients. Admin only.
    /// Supports optional query params: ?search=&lt;name&gt; and ?nic=&lt;nic&gt;
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
                Id = p.Id,
                FullName = p.FullName,
                NIC = p.NIC,
                PhoneNumber = p.PhoneNumber,
                District = p.District
            })
            .ToListAsync();

        return Ok(patients);
    }

    // ── GET /api/patients/{id} ─────────────────────────────────────────────
    /// <summary>
    /// Get a patient by ID.
    /// Admin: any patient. Patient: own record only. Doctor: 403.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientResponseDto>> GetById(int id)
    {
        var callerRole = GetCallerRole();

        // Doctors are explicitly forbidden from browsing arbitrary patient records
        if (callerRole == nameof(Role.Doctor))
            return Forbid();

        // Patients can only view their own record
        if (callerRole == nameof(Role.Patient))
        {
            var ownId = GetCurrentPatientId();
            if (ownId is null || ownId != id)
                return Forbid();
        }

        var patient = await _db.Patients
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PatientResponseDto
            {
                Id = p.Id,
                FullName = p.FullName,
                NIC = p.NIC,
                PhoneNumber = p.PhoneNumber,
                District = p.District
            })
            .FirstOrDefaultAsync();

        if (patient is null)
            return NotFound(new { message = $"Patient with ID {id} was not found." });

        return Ok(patient);
    }

    // ── POST /api/patients ─────────────────────────────────────────────────
    /// <summary>
    /// Create a patient profile.
    /// Patient users may create ONLY their own profile.
    /// Admin may create profiles for any user.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Patient")]
    public async Task<ActionResult<PatientResponseDto>> Create([FromBody] PatientCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // NIC uniqueness check
        if (await _db.Patients.AnyAsync(p => p.NIC == dto.NIC))
            return Conflict(new { message = "A patient with this NIC already exists." });

        var callerRole = GetCallerRole();
        var callerId = GetCurrentUserId();

        // A Patient user cannot already have a patient profile linked to their account
        if (callerRole == nameof(Role.Patient))
        {
            var existingPatientId = GetCurrentPatientId();
            if (existingPatientId.HasValue)
                return Conflict(new { message = "Your account already has a patient profile." });
        }

        var patient = new Patient
        {
            FullName = dto.FullName,
            NIC = dto.NIC,
            PhoneNumber = dto.PhoneNumber,
            District = dto.District
        };

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();

        // If the caller is a Patient, link their User record to this new Patient
        if (callerRole == nameof(Role.Patient) && callerId.HasValue)
        {
            var user = await _db.Users.FindAsync(callerId.Value);
            if (user is not null)
            {
                user.PatientId = patient.Id;
                await _db.SaveChangesAsync();
            }
        }

        var response = new PatientResponseDto
        {
            Id = patient.Id,
            FullName = patient.FullName,
            NIC = patient.NIC,
            PhoneNumber = patient.PhoneNumber,
            District = patient.District
        };

        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, response);
    }

    // ── PUT /api/patients/{id} ─────────────────────────────────────────────
    /// <summary>
    /// Update a patient profile.
    /// Admin: any patient. Patient: own record only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Patient")]
    public async Task<IActionResult> Update(int id, [FromBody] PatientUpdateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var callerRole = GetCallerRole();

        // Patients can only update their own record
        if (callerRole == nameof(Role.Patient))
        {
            var ownId = GetCurrentPatientId();
            if (ownId is null || ownId != id)
                return Forbid();
        }

        var patient = await _db.Patients.FindAsync(id);
        if (patient is null)
            return NotFound(new { message = $"Patient with ID {id} was not found." });

        // NIC uniqueness check when NIC is being changed
        if (patient.NIC != dto.NIC &&
            await _db.Patients.AnyAsync(p => p.NIC == dto.NIC && p.Id != id))
        {
            return Conflict(new { message = "A patient with this NIC already exists." });
        }

        patient.FullName = dto.FullName;
        patient.NIC = dto.NIC;
        patient.PhoneNumber = dto.PhoneNumber;
        patient.District = dto.District;

        await _db.SaveChangesAsync();

        return Ok(new PatientResponseDto
        {
            Id = patient.Id,
            FullName = patient.FullName,
            NIC = patient.NIC,
            PhoneNumber = patient.PhoneNumber,
            District = patient.District
        });
    }

    // ── DELETE /api/patients/{id} ──────────────────────────────────────────
    /// <summary>
    /// Delete a patient record. Admin only.
    /// Clears the PatientId FK on the linked User before deleting.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var patient = await _db.Patients.FindAsync(id);
        if (patient is null)
            return NotFound(new { message = $"Patient with ID {id} was not found." });

        // Unlink any User that points to this patient to preserve referential integrity
        var linkedUser = await _db.Users.FirstOrDefaultAsync(u => u.PatientId == id);
        if (linkedUser is not null)
        {
            linkedUser.PatientId = null;
            await _db.SaveChangesAsync();
        }

        _db.Patients.Remove(patient);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /// <summary>Returns the PatientId claim from the current JWT, or null if absent.</summary>
    private int? GetCurrentPatientId()
    {
        var claim = User.FindFirstValue("patientId");
        return int.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>Returns the UserId (sub) claim from the current JWT, or null if absent.</summary>
    private int? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>Returns the role string from the current JWT.</summary>
    private string GetCallerRole()
    {
        return User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}
