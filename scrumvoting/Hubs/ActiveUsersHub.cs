using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using scrumvoting.Controllers;

namespace scrumvoting.Hubs
{
    public class ActiveUsersHub : Hub
    {
        private IConfiguration _configuration;

        // Inject SessionController as a singleton service
        private SessionController _sessionController;
        private static string? adminConnectionId;
        private static DateTime? adminDisconnectedTimestamp = null;
        private Timer? sessionTimer = null;

        public ActiveUsersHub(SessionController sessionController, IConfiguration configuration)
        {
            _sessionController = sessionController;
            _configuration = configuration;
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            if (Context.ConnectionId == adminConnectionId)
            {
                adminDisconnectedTimestamp = DateTime.UtcNow;
                adminConnectionId = null;
            }

            await base.OnDisconnectedAsync(exception);
        }

        public void SetAdminConnected(string connectionId)
        {
            adminConnectionId = connectionId;
            adminDisconnectedTimestamp = null;

            // Start a background task to periodically check the adminDisconnectedTimestamp
            sessionTimer = new Timer(CheckAdminInactive, null, TimeSpan.Zero, TimeSpan.FromSeconds(10));

        }

        private void CheckAdminInactive(object state)
        {
            if (adminConnectionId == null && adminDisconnectedTimestamp != null)
            {
                // End the session if the admin has disconnected over a set amount of time
                var elapsedSeconds = (DateTime.UtcNow - adminDisconnectedTimestamp.Value).TotalSeconds;
                var timeoutSeconds = _configuration.GetValue<double>("Settings:AdminInactiveTimeoutInSeconds");
                if (elapsedSeconds >= timeoutSeconds)
                {
                    _sessionController.EndSession();

                    // When the session ends, destroy the timer
                    sessionTimer?.Change(Timeout.Infinite, Timeout.Infinite);
                    sessionTimer?.Dispose();
                    if (sessionTimer != null)
                    {
                        sessionTimer = null;
                    }
                }
            }
        }

        public async Task SendConnectionIdToClient(string clientConnectionId)
        {
            // Send the message to the specified client
            await Clients.Client(clientConnectionId).SendAsync("ReceiveConnectionId", clientConnectionId);
        }
    }
}