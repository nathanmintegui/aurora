using Dapper;

using Server.Database;
using Server.Domain.Models;

namespace Server.Modules.Questions.Infrastructure;

public interface IQuestionRepository
{
    Task AddAsync(Question question);
    Task<List<Question>> GetAsync();
    Task<Question?> GetByIdAsync(Guid id);
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

    public async Task<List<Question>> GetAsync()
    {
        const string query = """
                                select
                                    id,
                                    public_id,
                                    question_complexity_id,
                                    content,
                                    created_at,
                                    updated_at
                                from questions
                                order by id;
                             """;

        IEnumerable<QuestionSnapshot> results = await session.Connection.QueryAsync<QuestionSnapshot>(query);

        if (!results.Any())
        {
            return [];
        }

        return results
            .Select(row => QuestionSnapshot.ToModel(row))
            .ToList();
    }

    public async Task<Question?> GetByIdAsync(Guid id)
    {
        const string query = """
                                select
                                    id,
                                    public_id,
                                    question_complexity_id,
                                    content,
                                    created_at,
                                    updated_at
                                from questions
                                where public_id = @Id;
                             """;

        QuestionSnapshot? snapshot = await session.Connection.QueryFirstOrDefaultAsync<QuestionSnapshot>(
                query, new { Id = id });

        Question? question = snapshot is not null
            ? QuestionSnapshot.ToModel(snapshot)
            : null;

        return question;
    }
}

