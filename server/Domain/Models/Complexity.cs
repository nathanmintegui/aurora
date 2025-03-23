using Server.Domain.Models.Shared;

namespace Server.Domain.Models;

public sealed class Complexity
{
    private static readonly IReadOnlyList<Complexity> _validComplexities = new List<Complexity>
    {
        new(ComplexityId.Create(1), "Easy"),
        new(ComplexityId.Create(2), "Medium"),
        new(ComplexityId.Create(3), "Hard")
    };

    private Complexity(ComplexityId id, string description)
    {
        Id = id;
        Description = description;
    }

    public static Result<Complexity> FromId(int complexityId)
    {
        Complexity? found = _validComplexities.FirstOrDefault(c => c.Id.Value == complexityId);

        if (found is null)
        {
            return Result.Failure<Complexity>(new Error("Complexity.FromId", "Invalid complexity id."));
        }

        return found;
    }

    public ComplexityId Id { get; }
    public string Description { get; }

    public static IReadOnlyList<Complexity> ValidComplexities => _validComplexities;
}

public readonly record struct ComplexityId(int Value)
{
    public static ComplexityId Empty => new(0);

    public static ComplexityId Create(int value)
    {
        return new ComplexityId(value);
    }
}
