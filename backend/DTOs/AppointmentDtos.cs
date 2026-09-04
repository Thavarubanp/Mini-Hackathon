using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    // Used when a Patient books for themself; PatientId is optional here because
    // the controller fills it from the JWT for Patient callers. Admin must supply it.
    public class AppointmentCreateDto
    {
        public int? PatientId { get; set; }

        [Required]
        public int DoctorId { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; }

        [Required]
        public TimeSpan AppointmentTime { get; set; }

        [Required(ErrorMessage = "Reason is required")]
        [MaxLength(300)]
        public string Reason { get; set; } = string.Empty;
    }

    public class AppointmentUpdateDto
    {
        [Required]
        public int DoctorId { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; }

        [Required]
        public TimeSpan AppointmentTime { get; set; }

        [Required(ErrorMessage = "Reason is required")]
        [MaxLength(300)]
        public string Reason { get; set; } = string.Empty;
    }

    public class AppointmentStatusUpdateDto
    {
        [Required]
        [RegularExpression("^(Pending|Confirmed|Completed|Cancelled)$",
            ErrorMessage = "Status must be Pending, Confirmed, Completed or Cancelled")]
        public string Status { get; set; } = string.Empty;
    }

    public class AppointmentDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public TimeSpan AppointmentTime { get; set; }
        public string Reason { get; set; } = string.Empty;
        public int QueueNumber { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
