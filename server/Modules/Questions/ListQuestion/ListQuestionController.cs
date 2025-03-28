using Microsoft.AspNetCore.Mvc;

using Server.Domain.Models;
using Server.Modules.Questions.Infrastructure;

namespace Server.Modules.Questions.ListQuestion;

[ApiController]
[Route("questions")]
public class ListQuestionController(IQuestionRepository questionRepository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
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

    [HttpGet]
    [Route("{id:guid}")]
    public async Task<IActionResult> GetBydId(Guid id)
    {
        if (id == Guid.Empty)
        {
            return BadRequest("Question ID cannot be empty.");
        }

        Question? question = await questionRepository.GetByIdAsync(id);
        if (question is null)
        {
            return NotFound($"Question with ID {id} was not found.");
        }

        QuestionResponse response = new QuestionResponse(
                question.PublicId.Value,
                question.Complexity.Description,
                question.Content);

        return Ok(response);
    }
}

