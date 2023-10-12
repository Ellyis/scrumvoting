using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using scrumvoting.Hubs;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace scrumvoting.Controllers
{
    [Route("api/session")]
    public class SessionController : ControllerBase
    {
        private readonly IHubContext<ActiveUsersHub> _hubContext;

        // Inject Session object as a singleton service
        private Session _session;

        public SessionController(IHubContext<ActiveUsersHub> hubContext, Session session)
        {
            _hubContext = hubContext;
            _session = session;
        }

        [HttpGet("active")]
        public IActionResult CheckActiveSession()
        {
            // Return the boolean value indicating whether an active session exists
            return Ok(_session.IsActive);
        }

        [HttpGet("toggleShow")]
        public IActionResult CheckToggleShow()
        {
            // Return the boolean value indicating whether show points is toggled on
            return Ok(_session.ToggleShow);
        }

        [HttpPost("toggleShow")]
        public IActionResult UpdateToggleShow(bool toggleShow)
        {
            _session.ToggleShow = toggleShow;

            // Notify all clients about the updated toggls show value
            _hubContext.Clients.All.SendAsync("ReceiveToggleShow", toggleShow);

            return Ok("Toggle show updated");
        }

        [HttpPost("users")]
        public IActionResult CreateOrJoinSession(string username)
        {
            // Check if a user with the provided username already exists
            var existingUser = _session.ActiveUsers.FirstOrDefault(user => user.Name.Equals(username, StringComparison.OrdinalIgnoreCase));

            if (existingUser != null)
            {
                // Username already exists, return a response indicating that the username is already in use
                return Ok();
            }

            User user;

            // If no active session exists, the user creates a new session and becomes the admin
            if (!_session.IsActive)
            {
                user = new User
                {
                    Name = username,
                    Points = 0, // Set an initial number of points
                    IsAdmin = true // Set as admin
                };

                // Set session to active
                _session.IsActive = true;

                // Notify clients about the session existence
                _hubContext.Clients.All.SendAsync("ReceiveSessionExists", _session.IsActive);
            }
            // If an active session exists, the user joins as a regular participant
            else
            {
                user = new User
                {
                    Name = username,
                    Points = 0 // Set an initial number of points
                };
            }

            _session.ActiveUsers.Add(user);
            _hubContext.Clients.All.SendAsync("ReceiveActiveUsers", _session.ActiveUsers);

            //var token = GenerateToken(username);
            //_hubContext.Clients.Client(connectionId).SendAsync("ReceiveToken", token);

            return Ok(user);
        }

        [HttpDelete("users/{username}")]
        public IActionResult LeaveSession(string username)
        {
            // Find and remove the user from the list of active users
            var user = _session.ActiveUsers.FirstOrDefault(user => user.Name == username);
            if (user != null)
            {
                _session.ActiveUsers.Remove(user);
                _hubContext.Clients.All.SendAsync("ReceiveActiveUsers", _session.ActiveUsers);
                return Ok(user);
            }

            return NotFound();
        }

        [HttpDelete("users")]
        public IActionResult EndSession()
        {
            // Clear the list of active users to delete all users
            _session.ActiveUsers.Clear();

            // Set the flag to indicate an inactive session
            _session.IsActive = false;

            // Notify all clients that the session has ended
            _hubContext.Clients.All.SendAsync("ReceiveSessionExists", _session.IsActive);


            return Ok("Session has ended");
        }

        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            // Return the list of active users in the session
            return Ok(_session.ActiveUsers);
        }

        [HttpGet("users/{username}")]
        public IActionResult GetUserByUsername(string username)
        {
            var users = _session.ActiveUsers;
            // Find the user by username
            var user = _session.ActiveUsers.FirstOrDefault(user => user.Name.Equals(username, StringComparison.OrdinalIgnoreCase));

            if (user != null)
            {
                return Ok(user);
            }

            // User is not found
            return Ok();
        }

        [HttpPost("users/{username}")]
        public IActionResult UpdateUser(string username, int points)
        {
            // Find the user by username
            var user = _session.ActiveUsers.FirstOrDefault(user => user.Name.Equals(username, StringComparison.OrdinalIgnoreCase));

            if (user != null)
            {
                // Check if the user has already voted
                if (!user.HasVoted)
                {
                    // Update the user's points
                    user.Points = points;

                    // Mark the user as voted
                    user.HasVoted = true;

                    // Send the updated active users to all clients
                    _hubContext.Clients.All.SendAsync("ReceiveActiveUsers", _session.ActiveUsers);

                    return Ok(user);
                }
                else
                {
                    // Handle the case where the user has already voted
                    return BadRequest("User has already voted.");
                }
            }

            return NotFound();
        }

        [HttpPost("users/reset")]
        public IActionResult ResetUserPoints()
        {
            foreach (var user in _session.ActiveUsers)
            {
                user.Points = 0; // Reset each user's points to 0
                user.HasVoted = false;
            }

            _session.ToggleShow = false;

            // Send the updated active users to all clients
            _hubContext.Clients.All.SendAsync("ReceiveSessionRestarted", _session.ActiveUsers);

            return Ok("Session restarted");
        }

        //public string GenerateToken(string username)
        //{
        //    var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("this-is-my-very-long-token-secret-key"));
        //    var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

        //    var claims = new Claim[]
        //    {
        //        new Claim(ClaimTypes.Name, username),
        //        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        //        new Claim(JwtRegisteredClaimNames.Sub, username),
        //        new Claim(JwtRegisteredClaimNames.Iat, DateTime.UtcNow.ToString())
        //    };

        //    var token = new JwtSecurityToken(
        //        issuer: "your-issuer",
        //        audience: "your-audience",
        //        claims: claims,
        //        expires: DateTime.UtcNow.AddHours(1), // Set token expiration time
        //        signingCredentials: signingCredentials
        //    );

        //    var tokenHandler = new JwtSecurityTokenHandler();
        //    return tokenHandler.WriteToken(token);
        //}

    }
}