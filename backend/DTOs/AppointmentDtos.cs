using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class AppointmentCreateDto
    {
        public int PatientId { get; set; }

        [Required(ErrorMessage = "Patient name is required.")]
        public string PatientName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Patient phone is required.")]
        public string PatientPhone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Doctor is required.")]
        public int DoctorId { get; set; }

        public string DoctorName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Hospital is required.")]
        public int HospitalId { get; set; }

        public string HospitalName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Appointment date is required.")]
        public DateTime AppointmentDate { get; set; }
    }

    public class AppointmentResponseDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string PatientPhone { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public int HospitalId { get; set; }
        public string HospitalName { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public int QueueNumber { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AppointmentStatusUpdateDto
    {
        [Required]
        public string Status { get; set; } = "Confirmed";
    }
}
