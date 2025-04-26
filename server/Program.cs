using Dapper;

using Microsoft.Extensions.Caching.StackExchangeRedis;

using Server.Database;
using Server.Modules.Questions.Infrastructure;

using Services;

using ZiggyCreatures.Caching.Fusion;
using ZiggyCreatures.Caching.Fusion.Serialization.SystemTextJson;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Host.SerilogConfiguration();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

string connectionString = builder.Configuration["DbConnectionString"]
                          ?? throw new InvalidOperationException("Database connection string is missing.");

builder.Services.AddScoped(_ => new DbSession(connectionString));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();

/**
 * Hybrid Caching
 * */
builder.Services.AddFusionCache()
    .WithDefaultEntryOptions(options =>
            options.Duration = TimeSpan.FromMinutes(long.Parse(builder.Configuration["DefaultCacheInMinutes"]!)))
    .WithSerializer(new FusionCacheSystemTextJsonSerializer())
    .WithDistributedCache(
            new RedisCache(new RedisCacheOptions { Configuration = "localhost:6379" })
    ).AsHybridCache();

builder.Services.AddCors(options => options.AddPolicy("AngularUI",
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

app.UseCors("AngularUI");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

#pragma warning disable S6966
app.Run();
#pragma warning restore S6966

