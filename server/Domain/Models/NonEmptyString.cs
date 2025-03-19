namespace Server.Domain.Models;

public readonly record struct NonEmptyString
{
    public string Value { get; }

    public NonEmptyString(string value)
    {
        Value = !string.IsNullOrWhiteSpace(value)
            ? value.Trim()
            : throw new ArgumentException("Value cannot be null or empty.", nameof(value));
    }

    public static implicit operator string(NonEmptyString value)
    {
        return value.Value;
    }

    public override string ToString()
    {
        return Value;
    }
}

