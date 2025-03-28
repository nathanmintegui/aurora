using System.Diagnostics;

using Server.Domain.Models.Shared;

namespace Server.Domain.Models;

public class Question
{
#pragma warning disable CS8618, CS9264
    private Question() { }
#pragma warning restore CS8618, CS9264

    private Question(
        QuestionId id,
        PublicQuestionId publicId,
        Complexity complexity,
        string content,
        DateTime createdAt,
        DateTime updatedAt)
    {
        Id = id;
        PublicId = publicId;
        Complexity = complexity;
        Content = content;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public static Question Create(NonEmptyString Content, Complexity Complexity)
    {
        Question question = new(
            QuestionId.Empty,
            PublicQuestionId.Create(Guid.NewGuid()),
            Complexity,
            Content,
            DateTime.Now,
            DateTime.Now);

        return question;
    }

    public static Question Create(QuestionSnapshot snapshot)
    {
        Debug.Assert(snapshot is not null);

        QuestionId id = QuestionId.Create(snapshot.Id);
        PublicQuestionId publicId = PublicQuestionId.Create(snapshot.PublicId);
        Result<Complexity> complexityResult = Complexity.FromId(snapshot.QuestionComplexityId);
        NonEmptyString content = new NonEmptyString(snapshot.Content);

        Question question = new(
                id,
                publicId,
                complexityResult.Value,
                content,
                snapshot.CreatedAt,
                snapshot.UpdatedAt);

        return question;
    }

    public QuestionId Id { get; internal set; }
    public PublicQuestionId PublicId { get; internal set; }
    public Complexity Complexity { get; }
    public string Content { get; }
    public DateTime CreatedAt { get; }
    public DateTime UpdatedAt { get; }
}

public record struct QuestionId(int Value)
{
    public static QuestionId Empty => new(0);

    public static QuestionId Create(int value)
    {
        return new QuestionId(value);
    }
}

public record struct PublicQuestionId(Guid Value)
{
    public static PublicQuestionId Empty => new(Guid.Empty);

    public static PublicQuestionId Create(Guid value)
    {
        return new PublicQuestionId(value);
    }
}

