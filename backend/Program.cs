using backend.Data;
using backend.Service;
using Microsoft.EntityFrameworkCore;
using OpenAI.Chat;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<LifeStoryDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("LifeStoryDb")));

string modelName = builder.Configuration["OpenAI:ModelName"];
string ApiKey = builder.Configuration["OpenAI:ApiKey"];

// Add services to the container.
builder.Services.AddSingleton<ChatClient>(_ =>
    new ChatClient(
        model: modelName,
        apiKey: ApiKey
));

builder.Services.AddScoped<OpenAiStoryService>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("ReactApp");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
