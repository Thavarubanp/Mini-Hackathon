using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using backend.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        /// <summary>
        /// Login endpoint supporting role-based authentication (Admin, Doctor, Patient).
        /// </summary>
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Normalize role
            string role = request.Role?.Trim() ?? "Admin";
            if (string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase)) role = "Admin";
            else if (string.Equals(role, "doctor", StringComparison.OrdinalIgnoreCase)) role = "Doctor";
            else if (string.Equals(role, "patient", StringComparison.OrdinalIgnoreCase)) role = "Patient";

            var secretKey = _config["Jwt:SecretKey"] ?? "SuwaSewaLK_SecretKey_For_JWT_Authentication_2026_Hackathon!";
            var issuer = _config["Jwt:Issuer"] ?? "SuwaSewaLK";
            var audience = _config["Jwt:Audience"] ?? "SuwaSewaLKClients";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, request.Username.Trim()),
                new Claim(ClaimTypes.Name, request.Username.Trim()),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new LoginResponseDto
            {
                Token = tokenString,
                Username = request.Username.Trim(),
                Role = role,
                Message = $"Logged in successfully as {role}"
            });
        }
    }
}
