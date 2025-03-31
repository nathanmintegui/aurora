namespace Server.Modules.Questions.ListQuestion;

public record QuestionResponse(
    Guid Id,
    string Complexity,
    string Content,
    List<CodeScaffoldResponse> CodeScaffold);

public record CodeScaffoldResponse(int Id, string Code, string Lang);
