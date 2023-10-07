using Microsoft.AspNetCore.SignalR;

namespace scrumvoting.Hubs
{
    public class ActiveUsersHub : Hub
    {
        public async Task SendActiveSessionExists(bool activeSessionExists)
        {
            // Send the activeSessionExists value to all connected clients
            await Clients.All.SendAsync("ReceiveActiveSessionExists", activeSessionExists);
        }

        public async Task SendActiveUsers(List<User> activeUsers)
        {
            // Send the active users to all connected clients
            await Clients.All.SendAsync("ReceiveActiveUsers", activeUsers);
        }
    }
}


