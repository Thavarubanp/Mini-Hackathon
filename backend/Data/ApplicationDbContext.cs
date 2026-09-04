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
        public DbSet<Patient> Patients { get; set; } = null!;

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

            // ── Patient ───────────────────────────────────────────────────
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.FullName).IsRequired().HasMaxLength(200);
                entity.Property(p => p.NIC).IsRequired().HasMaxLength(20);
                entity.HasIndex(p => p.NIC).IsUnique();  // NIC must be unique
                entity.Property(p => p.PhoneNumber).IsRequired().HasMaxLength(10);
                entity.Property(p => p.District).IsRequired().HasMaxLength(100);
            });
        }
    }
}
