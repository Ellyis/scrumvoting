using Microsoft.AspNetCore.SignalR;

namespace scrumvoting.Hubs
{
    public class ActiveUsersHub : Hub
    {
        private static Dictionary<string, string> connectedClients = new Dictionary<string, string>();

        public override async Task OnConnectedAsync()
        {
            // Add the connected client to the list
            connectedClients[Context.ConnectionId] = Context.UserIdentifier;

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Remove the disconnected client from the list
            if (connectedClients.ContainsKey(Context.ConnectionId))
            {
                connectedClients.Remove(Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}


