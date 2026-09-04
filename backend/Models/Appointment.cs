using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        [Required]
        public int PatientId { get; set; }

        [ForeignKey(nameof(PatientId))]
        public Patient? Patient { get; set; }

        [Required]
        public int DoctorId { get; set; }

        [ForeignKey(nameof(DoctorId))]
        public Doctor? Doctor { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; } // date only, time kept separate

        [Required]
        public TimeSpan AppointmentTime { get; set; }

        [Required]
        [MaxLength(300)]
        public string Reason { get; set; } = string.Empty;

        public int QueueNumber { get; set; }

        // Pending | Confirmed | Completed | Cancelled
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
