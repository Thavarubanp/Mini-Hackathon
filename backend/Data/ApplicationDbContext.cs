using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Hospital> Hospitals { get; set; } = null!;
        public DbSet<Doctor> Doctors { get; set; } = null!;
        public DbSet<Patient> Patients { get; set; } = null!;
        public DbSet<Appointment> Appointments { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Hospital>(entity =>
            {
                entity.HasKey(h => h.Id);
                entity.Property(h => h.Name).IsRequired().HasMaxLength(200);
                entity.Property(h => h.District).IsRequired().HasMaxLength(100);
                entity.Property(h => h.Address).IsRequired().HasMaxLength(500);
                entity.Property(h => h.ContactNumber).IsRequired().HasMaxLength(10);
            });

            modelBuilder.Entity<Doctor>(entity =>
            {
                entity.HasKey(d => d.Id);
                entity.Property(d => d.FullName).IsRequired().HasMaxLength(200);
                entity.Property(d => d.Specialization).IsRequired().HasMaxLength(100);
                entity.Property(d => d.AvailableDay).IsRequired().HasMaxLength(20);
                entity.Property(d => d.AvailableStartTime).IsRequired();
                entity.Property(d => d.AvailableEndTime).IsRequired();

                entity.HasOne(d => d.Hospital)
                      .WithMany()
                      .HasForeignKey(d => d.HospitalId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.FullName).IsRequired().HasMaxLength(200);
                entity.Property(p => p.NIC).IsRequired().HasMaxLength(20);
                entity.Property(p => p.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(p => p.District).IsRequired().HasMaxLength(100);
                entity.HasIndex(p => p.NIC).IsUnique();
            });

            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.Property(a => a.PatientName).IsRequired().HasMaxLength(200);
                entity.Property(a => a.DoctorName).IsRequired().HasMaxLength(200);
                entity.Property(a => a.HospitalName).IsRequired().HasMaxLength(200);
                entity.Property(a => a.Status).IsRequired().HasMaxLength(50);

                entity.HasOne(a => a.Hospital)
                      .WithMany()
                      .HasForeignKey(a => a.HospitalId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Doctor)
                      .WithMany()
                      .HasForeignKey(a => a.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Patient)
                      .WithMany()
                      .HasForeignKey(a => a.PatientId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
