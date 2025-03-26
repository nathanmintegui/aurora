using Dapper;

using Server.Database;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

string connectionString = builder.Configuration["DbConnectionString"]
                          ?? throw new InvalidOperationException("Database connection string is missing.");

builder.Services.AddScoped(_ => new DbSession(connectionString));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddCors(options => options.AddPolicy(name: "AngularUI",
            policy =>
            {
                policy.WithOrigins("http://localhost:4200/")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowAnyOrigin();
            }));

DefaultTypeMap.MatchNamesWithUnderscores = true;

WebApplication app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AngularUI"); ;

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

#pragma warning disable S6966
app.Run();
#pragma warning restore S6966
