using System.Diagnostics;

namespace Server.Domain.Models;

public class CodeQuestionScaffold
{
    public CodeQuestionScaffold(int id, int questionId, string code, int langId)
    {
        Id = id;
        QuestionId = questionId;
        Code = code;
        LangId = langId;
        Question = null!;
        Lang = null!;
    }

    public void AddQuestion(Question question)
    {
        Debug.Assert(question is not null);

        Question = question;
    }

    public void AddLang(Lang lang)
    {
        Debug.Assert(lang is not null);

        Lang = lang;
    }

    public int Id { get; private set; }
    public int QuestionId { get; private set; }
    public string Code { get; private set; }
    public int LangId { get; private set; }

    public Question Question { get; private set; }
    public Lang Lang { get; private set; }
}
