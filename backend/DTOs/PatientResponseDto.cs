namespace backend.DTOs;

public class PatientResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string NIC { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
}
