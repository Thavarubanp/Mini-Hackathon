namespace backend.Models;

public class Patient
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string NIC { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    // Navigation property – one Patient has at most one User account
    public User? User { get; set; }
}
