using scrumvoting;
using scrumvoting.Controllers;
using scrumvoting.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<Session>();
builder.Services.AddSingleton<SessionController>();
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
}

app.UseStaticFiles();
app.UseRouting();


app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");

app.UseCors(options =>
    options.WithOrigins("http://localhost", "http://localhost:44471", "https://apps01.esrimy.com")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials()
);

app.MapHub<ActiveUsersHub>("/activeUsersHub");

app.Run();
