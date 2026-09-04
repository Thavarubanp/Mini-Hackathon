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
        }
    }
}
