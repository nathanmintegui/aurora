using Server.Domain.Models.Shared;

namespace Server.Domain.Models;

public sealed class Lang
{
    private static readonly IReadOnlyList<Lang> _validLangs = new List<Lang>
    {
        new(LangId.Create(1), "Javascript", "JS"),
        new(LangId.Create(2), "Java", "Java"),
        new(LangId.Create(3), "Python", "PY")
    };

    private Lang(LangId id, string name, string abbreviation)
    {
        Id = id;
        Name = name;
        Abbreviation = abbreviation;
    }

    public static Result<Lang> FromId(int LangId)
    {
        Lang? found = _validLangs.FirstOrDefault(l => l.Id.Value == LangId);

        if (found is null)
        {
            return Result.Failure<Lang>(new Error("Lang.FromId", "Invalid lang id."));
        }

        return found;
    }

    public LangId Id { get; }
    public string Name { get; }
    public string Abbreviation { get; }

    public static IReadOnlyList<Lang> ValidLangs => _validLangs;
}

public readonly record struct LangId(int Value)
{
    public static LangId Empty => new(0);

    public static LangId Create(int value)
    {
        return new LangId(value);
    }
}
