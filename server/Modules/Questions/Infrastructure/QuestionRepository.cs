using Dapper;

using Server.Database;
using Server.Domain.Models;
using Server.Domain.Models.Shared;

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
        const string query = $"""
                                 select
                                     c.id as id,
                                     c.public_id,
                                     c.question_complexity_id,
                                     c."content",
                                     c.created_at,
                                     c.updated_at,
                                     cqs.id as CodeQuestionScaffoldId,
                                     cqs.question_id,
                                     cqs.code,
                                     cqs.lang_id
                                 from questions c
                                 left join code_question_scaffold cqs on cqs.question_id = c.id
                                 order by c.id;
                              """;

        Dictionary<Guid, QuestionSnapshot> questionsDictionary = [];
        await session.Connection
            .QueryAsync<QuestionSnapshot?, CodeQuestionScaffoldSnapshot?, QuestionSnapshot>(
                query,
                (question, codeQuestionScaffold) =>
                {
                    if (question is null)
                    {
                        return null!;
                    }

                    if (questionsDictionary.TryGetValue(question.PublicId, out QuestionSnapshot? existingQuestion))
                    {
                        question = existingQuestion;
                    }
                    else
                    {
                        questionsDictionary.Add(question.PublicId, question);
                    }

                    if (codeQuestionScaffold is not null)
                    {
                        question.CodeQuestionScaffolds.Add(codeQuestionScaffold);
                    }

                    return question;
                },
                splitOn: "CodeQuestionScaffoldId");

        if (questionsDictionary.Count == 0)
        {
            return [];
        }

        List<Question> questions = [];
        foreach (QuestionSnapshot entry in questionsDictionary.Select(entry => entry.Value))
        {
            Question question = QuestionSnapshot.ToModel(entry);

            if (entry.CodeQuestionScaffolds.Count != 0)
            {
                entry.CodeQuestionScaffolds.ForEach(cqs =>
                {
                    CodeQuestionScaffold codeQuestionScaffold = CodeQuestionScaffoldSnapshot.ToModel(cqs);
                    question.CodeQuestionScaffolds.Add(codeQuestionScaffold);
                    Result<Lang> langResult = Lang.FromId(cqs.LangId);
                    codeQuestionScaffold.AddLang(langResult.Value);
                    codeQuestionScaffold.AddQuestion(question);
                });
            }

            questions.Add(question);
        }

        return questions;
    }

    public async Task<Question?> GetByIdAsync(Guid id)
    {
        const string query = $"""
                                 select
                                     c.id as id,
                                     c.public_id,
                                     c.question_complexity_id,
                                     c."content",
                                     c.created_at,
                                     c.updated_at,
                                     cqs.id as CodeQuestionScaffoldId,
                                     cqs.question_id,
                                     cqs.code,
                                     cqs.lang_id
                                 from questions c
                                 left join code_question_scaffold cqs on cqs.question_id = c.id
                                 where c.public_id = @Id;
                              """;

        Dictionary<Guid, QuestionSnapshot> questionsDictionary = [];
        await session.Connection
            .QueryAsync<QuestionSnapshot?, CodeQuestionScaffoldSnapshot?, QuestionSnapshot>(
                query,
                (question, codeQuestionScaffold) =>
                {
                    if (question is null)
                    {
                        return null!;
                    }

                    if (questionsDictionary.TryGetValue(question.PublicId, out QuestionSnapshot? existingQuestion))
                    {
                        question = existingQuestion;
                    }
                    else
                    {
                        questionsDictionary.Add(question.PublicId, question);
                    }

                    if (codeQuestionScaffold is not null)
                    {
                        question.CodeQuestionScaffolds.Add(codeQuestionScaffold);
                    }

                    return question;
                },
                new { Id = id },
                splitOn: "CodeQuestionScaffoldId");

        if (!questionsDictionary.TryGetValue(id, out QuestionSnapshot? foundQuestion))
        {
            Console.WriteLine("Try get value from dictionary failed");

            return null;
        }

        Question question = QuestionSnapshot.ToModel(foundQuestion);
        if (foundQuestion.CodeQuestionScaffolds.Count != 0)
        {
            foundQuestion.CodeQuestionScaffolds.ForEach(cqs =>
            {
                CodeQuestionScaffold codeQuestionScaffold = CodeQuestionScaffoldSnapshot.ToModel(cqs);
                question.CodeQuestionScaffolds.Add(codeQuestionScaffold);
                Result<Lang> langResult = Lang.FromId(cqs.LangId);
                codeQuestionScaffold.AddLang(langResult.Value);
                codeQuestionScaffold.AddQuestion(question);
            });
        }

        return question;
    }
}
