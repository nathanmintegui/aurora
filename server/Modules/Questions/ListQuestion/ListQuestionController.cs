using Microsoft.AspNetCore.Mvc;

using Server.Domain.Models;
using Server.Modules.Questions.Infrastructure;

namespace Server.Modules.Questions.ListQuestion;

[ApiController]
[Route("questions")]
public class ListQuestionController(
        ILogger<ListQuestionController> logger,
        IQuestionRepository questionRepository
) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        logger.LogInformation("{Time} | GET /questions", DateTime.Now.ToString("HH:mm:ss"));

        List<Question> questions = await questionRepository.GetAsync();
        if (!questions.Any())
        {
            return Ok(Enumerable.Empty<string>());
        }

        List<QuestionResponse> response = questions
            .Select(q => new QuestionResponse(q.PublicId.Value, q.Complexity.Description, q.Content))
            .ToList();

        return Ok(response);
    }
}

