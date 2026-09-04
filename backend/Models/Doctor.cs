using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Doctor
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Specialization { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string AvailableDay { get; set; } = string.Empty;

        public TimeOnly AvailableStartTime { get; set; }

        public TimeOnly AvailableEndTime { get; set; }

        public int HospitalId { get; set; }

        public Hospital Hospital { get; set; } = null!;
    }
}
