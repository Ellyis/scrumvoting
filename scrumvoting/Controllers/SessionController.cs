using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using scrumvoting.Hubs;

namespace scrumvoting.Controllers
{
    [Route("api/session")]
    public class SessionController : ControllerBase
    {
        private readonly IHubContext<ActiveUsersHub> _hubContext;

        // Inject the activeUsers list as a singleton service
        private List<User> activeUsers;
        private ActiveSession _activeSession;

        public SessionController(IHubContext<ActiveUsersHub> hubContext, List<User> activeUsers, ActiveSession activeSession)
        {
            _hubContext = hubContext;
            this.activeUsers = activeUsers;
            _activeSession = activeSession;
        }

        [HttpGet("active")]
        public IActionResult CheckActiveSession()
        {
            // Return the boolean value indicating whether an active session exists
            return Ok(_activeSession.Exists);
        }

        [HttpPost("users")]
        public IActionResult CreateOrJoinSession(string username)
        {
            User user;

            // If no active session exists, the user creates a new session and becomes the admin
            if (!_activeSession.Exists)
            {
                user = new User
                {
                    Name = username,
                    Points = 0, // Set an initial number of points
                    IsAdmin = true // Set as admin
                };

                // Set the flag to indicate an active session
                _activeSession.Exists = true;

                _hubContext.Clients.All.SendAsync("ReceiveActiveSessionExists", _activeSession.Exists);
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

            activeUsers.Add(user);
            _hubContext.Clients.All.SendAsync("ReceiveActiveUsers", activeUsers);

            return Ok(user);
        }

        [HttpDelete("users/{username}")]
        public IActionResult LeaveSession(string username)
        {
            // Find and remove the user from the list of active users
            var user = activeUsers.FirstOrDefault(user => user.Name == username);
            if (user != null)
            {
                activeUsers.Remove(user);

                return Ok(user);
            }

            return NotFound();
        }

        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            // Return the list of active users in the session
            return Ok(activeUsers);
        }

        [HttpGet("users/{username}")]
        public IActionResult GetUserByUsername(string username)
        {
            var users = activeUsers;
            // Find the user by username
            var user = activeUsers.FirstOrDefault(user => user.Name.Equals(username, StringComparison.OrdinalIgnoreCase));

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
            var user = activeUsers.FirstOrDefault(user => user.Name.Equals(username, StringComparison.OrdinalIgnoreCase));

            if (user != null)
            {
                // Update the user's points
                user.Points = points;

                // Send the updated active users to all clients
                _hubContext.Clients.All.SendAsync("ReceiveActiveUsers", activeUsers);

                return Ok(user);
            }

            return NotFound();
        }

    }
}