using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class DoctorCreateDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(200, ErrorMessage = "Full name must not exceed 200 characters.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Specialization is required.")]
        [MaxLength(100, ErrorMessage = "Specialization must not exceed 100 characters.")]
        public string Specialization { get; set; } = string.Empty;

        [Required(ErrorMessage = "Available day is required.")]
        public string AvailableDay { get; set; } = string.Empty;

        [Required(ErrorMessage = "Available start time is required.")]
        public string AvailableStartTime { get; set; } = string.Empty;

        [Required(ErrorMessage = "Available end time is required.")]
        public string AvailableEndTime { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "A valid hospital must be selected.")]
        public int HospitalId { get; set; }
    }

    public class DoctorUpdateDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(200, ErrorMessage = "Full name must not exceed 200 characters.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Specialization is required.")]
        [MaxLength(100, ErrorMessage = "Specialization must not exceed 100 characters.")]
        public string Specialization { get; set; } = string.Empty;

        [Required(ErrorMessage = "Available day is required.")]
        public string AvailableDay { get; set; } = string.Empty;

        [Required(ErrorMessage = "Available start time is required.")]
        public string AvailableStartTime { get; set; } = string.Empty;

        [Required(ErrorMessage = "Available end time is required.")]
        public string AvailableEndTime { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "A valid hospital must be selected.")]
        public int HospitalId { get; set; }
    }

    public class DoctorResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string AvailableDay { get; set; } = string.Empty;
        public string AvailableStartTime { get; set; } = string.Empty;
        public string AvailableEndTime { get; set; } = string.Empty;
        public int HospitalId { get; set; }
        public string HospitalName { get; set; } = string.Empty;
    }
}
