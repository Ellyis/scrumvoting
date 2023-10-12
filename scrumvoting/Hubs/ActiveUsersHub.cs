using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using scrumvoting.Controllers;

namespace scrumvoting.Hubs
{
    public class ActiveUsersHub : Hub
    {
        // Inject SessionController as a singleton service
        //private SessionController _sessionController;
        //private static Dictionary<string, string?> connectedClients = new Dictionary<string, string?>();
        //private static string? adminConnectionId;
        //private static string? adminUsername;

        //public ActiveUsersHub(SessionController sessionController)
        //{
        //    _sessionController = sessionController;
        //}

        //public override async Task OnConnectedAsync()
        //{
        //    // Add the connected client's connection ID to the dictionary
        //    var connectionId = Context.ConnectionId;
        //    connectedClients[connectionId] = null;
        //    Clients.Client(connectionId).SendAsync("ReceiveConnectionId", connectionId);

        //    await base.OnConnectedAsync();
        //}

        //public void SetAdminConnection(string connectionId, string username)
        //{
        //    adminConnectionId = connectionId;
        //    adminUsername = username;
        //}

        //// Update dictionary with username
        //public void SetUsername(string connectionId, string username)
        //{
        //    if (connectedClients.ContainsKey(connectionId))
        //    {
        //        connectedClients[connectionId] = username;
        //        Console.WriteLine(connectedClients);
        //    }
        //}

        //public override async Task OnDisconnectedAsync(Exception exception)
        //{
        //    var connectionId = Context.ConnectionId;

        //    // If admin disconnects, reset admin details and end the session
        //    if (connectionId == adminConnectionId)
        //    {
        //        adminConnectionId = null;
        //        adminUsername = null;
        //        _sessionController.EndSession();
        //    }
        //    // Else only the client leaves the session
        //    else
        //    {
        //        var username = connectedClients[connectionId];
        //        _sessionController.LeaveSession(username);
        //    }

        //    // Remove the disconnected client's connection ID from the dictionary
        //    if (connectedClients.ContainsKey(connectionId))
        //    {
        //        connectedClients.Remove(connectionId);
        //    }

        //    await base.OnDisconnectedAsync(exception);
        //}

        public async Task SendConnectionIdToClient(string clientConnectionId)
        {
            // Send the message to the specified client
            await Clients.Client(clientConnectionId).SendAsync("ReceiveConnectionId", clientConnectionId);
        }
    }
}


