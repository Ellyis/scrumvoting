using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using scrumvoting.Hubs;

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
        public IActionResult GetIsActive()
        {
            // Return the boolean value indicating whether an active session exists
            return Ok(_session.IsActive);
        }

        [HttpGet("reveal")]
        public IActionResult GetIsRevealed()
        {
            // Return the boolean value indicating whether show points is toggled on
            Console.WriteLine(_session.IsRevealed);
            return Ok(_session.IsRevealed);
        }

        [HttpPost("reveal")]
        public IActionResult UpdateIsRevealed()
        {
            _session.IsRevealed = true;

            // Notify all clients about the updated toggls show value
            _hubContext.Clients.All.SendAsync("ReceiveIsRevealed", true);

            return Ok("Toggle show updated");
        }

        [HttpPost("users")]
        public IActionResult CreateOrJoinSession(string username, string connectionId)
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
                _hubContext.Clients.All.SendAsync("ReceiveSessionExists", true);
                _hubContext.Clients.Client(connectionId).SendAsync("ReceiveAdminConnectionId", connectionId);
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
            _hubContext.Clients.All.SendAsync("ReceiveNewUser", username);

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
                _hubContext.Clients.All.SendAsync("ReceiveLeftUser", username);
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
            _hubContext.Clients.All.SendAsync("ReceiveSessionExists", false);


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
        public IActionResult UpdateUserPoints(string username, int points)
        {
            // Find the user by username
            var user = _session.ActiveUsers.FirstOrDefault(user => user.Name.Equals(username, StringComparison.OrdinalIgnoreCase));

            if (user != null)
            {
                if (!user.HasVoted)
                {
                    // Mark the user as voted
                    user.HasVoted = true;
                }

                // Update the user's points
                user.Points = points;

                // Send the updated active users to all clients
                _hubContext.Clients.All.SendAsync("ReceiveActiveUsers", _session.ActiveUsers);

                return Ok(user);
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

            _session.IsRevealed = false;

            // Send the updated active users to all clients
            _hubContext.Clients.All.SendAsync("ReceiveVotesReset", _session.ActiveUsers);

            return Ok("Session restarted");
        }
    }
}