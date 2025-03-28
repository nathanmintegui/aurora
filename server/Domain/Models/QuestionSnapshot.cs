using System.Diagnostics;

namespace Server.Domain.Models;

public sealed class QuestionSnapshot
{
    public int Id { get; init; }
    public Guid PublicId { get; init; }
    public int QuestionComplexityId { get; init; }
    public string Content { get; init; } = String.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }

    public static QuestionSnapshot From(Question question)
    {
        throw new NotImplementedException();
    }

    public static Question ToModel(QuestionSnapshot snapshot)
    {
        Debug.Assert(snapshot is not null);

        Question question = Question.Create(snapshot);

        return question;
    }
}

