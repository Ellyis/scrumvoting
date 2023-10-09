namespace scrumvoting
{
    public class Session
    {
        public List<User> ActiveUsers { get; set; }
        public bool IsActive { get; set; }
        public bool ToggleShow { get; set; }

        public Session()
        {
            ActiveUsers = new List<User>();
            IsActive = false;
            ToggleShow = false;
        }
    }
}
