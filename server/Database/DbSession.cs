using System.Data;

using Npgsql;

namespace Server.Database;

public sealed class DbSession : IDisposable
{
    public IDbConnection Connection { get; }
    public IDbTransaction Transaction { get; set; } = null!;

    public DbSession(string connectionStrring)
    {
        Connection = new NpgsqlConnection(connectionStrring);
        Connection.Open();
    }

    public void Dispose()
    {
        Connection?.Dispose();
    }
}
