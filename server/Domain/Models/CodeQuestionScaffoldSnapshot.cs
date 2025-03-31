namespace Server.Domain.Models;

public class CodeQuestionScaffoldSnapshot
{
    public int CodeQuestionScaffoldId { get; }
    public int QuestionId { get; }
    public string Code { get; private set; } = string.Empty;
    public int LangId { get; }

    public static CodeQuestionScaffoldSnapshot From(CodeQuestionScaffold codeQuestionScaffold)
    {
        throw new NotImplementedException();
    }

    public static CodeQuestionScaffold ToModel(CodeQuestionScaffoldSnapshot snapshot)
    {
        CodeQuestionScaffold codeQuestionScaffold = new(
            snapshot.CodeQuestionScaffoldId,
            snapshot.QuestionId,
            snapshot.Code,
            snapshot.LangId);

        return codeQuestionScaffold;
    }
}
