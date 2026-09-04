using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string PatientPhone { get; set; } = string.Empty;

        [Required]
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;

        [Required]
        public int HospitalId { get; set; }
        public string HospitalName { get; set; } = string.Empty;

        [Required]
        public DateTime AppointmentDate { get; set; }

        public string Reason { get; set; } = string.Empty;

        public int QueueNumber { get; set; }

        public string Status { get; set; } = "Confirmed";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Hospital? Hospital { get; set; }
        public Doctor? Doctor { get; set; }
        public Patient? Patient { get; set; }
    }
}
