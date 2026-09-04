using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class HospitalCreateDto
    {
        [Required(ErrorMessage = "Name is required.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required.")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "Address is required.")]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact number is required.")]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Contact number must contain exactly 10 digits.")]
        public string ContactNumber { get; set; } = string.Empty;
    }

    public class HospitalUpdateDto
    {
        [Required(ErrorMessage = "Name is required.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required.")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "Address is required.")]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact number is required.")]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Contact number must contain exactly 10 digits.")]
        public string ContactNumber { get; set; } = string.Empty;
    }

    public class HospitalResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
    }
}
