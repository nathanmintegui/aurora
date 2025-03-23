using Dapper;

using Server.Database;
using Server.Domain.Models;

namespace Server.Modules.Questions.Infrastructure;

public interface IQuestionRepository
{
    Task AddAsync(Question question);
}

public sealed class QuestionRepository(DbSession session) : IQuestionRepository
{
    public async Task AddAsync(Question question)
    {
        const string query = """
                                 insert into questions
                                 (public_id, "content", created_at, updated_at)
                                 values(@PublicId, @Content, @CreatedAt, @UpdatedAt)
                                 returning id;
                             """;

        int id = await session.Connection.ExecuteScalarAsync<int>(query, question, session.Transaction);

        question.Id = QuestionId.Create(id);
    }
}
