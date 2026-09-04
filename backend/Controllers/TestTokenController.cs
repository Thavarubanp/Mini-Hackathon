using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestTokenController : ControllerBase
    {
        private readonly IConfiguration _config;

        public TestTokenController(IConfiguration config)
        {
            _config = config;
        }

        /// <summary>
        /// Generates a test JWT token for Swagger testing (Roles: Admin, Patient, Doctor).
        /// </summary>
        [HttpGet("generate")]
        public IActionResult GenerateToken([FromQuery] string role = "Admin")
        {
            var secretKey = _config["Jwt:SecretKey"] ?? "SuwaSewaLK_SecretKey_For_JWT_Authentication_2026_Hackathon!";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Name, "Test User"),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            return Ok(new { token = tokenString, role = role });
        }
    }
}
