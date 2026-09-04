using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class PatientUpdateDto
{
    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(200, ErrorMessage = "Full name cannot exceed 200 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "NIC is required.")]
    [MaxLength(20, ErrorMessage = "NIC cannot exceed 20 characters.")]
    public string NIC { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "District is required.")]
    [MaxLength(100, ErrorMessage = "District cannot exceed 100 characters.")]
    public string District { get; set; } = string.Empty;
}
