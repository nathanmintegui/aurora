namespace Server.Modules.Questions.SubmitQuestion;

public record SubmittedQuestion(Guid RequestId, Guid QuestionId, Guid UserId, string Lang, string Code);
