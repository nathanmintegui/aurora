using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Hybrid;

using Server.Domain.Models;
using Server.Modules.Questions.Infrastructure;

namespace Server.Modules.Questions.ListQuestion;

[ApiController]
[Route("questions")]
public class ListQuestionController(IQuestionRepository questionRepository, HybridCache hybridCache) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        const string cacheKey = "Questions_";

        List<QuestionResponse> response = await hybridCache.GetOrCreateAsync<List<QuestionResponse>>(cacheKey,
            async _ =>
               {
                   List<Question> questions = await questionRepository.GetAsync();
                   if (questions.Count == 0)
                   {
                       return [];
                   }

                   return questions
                       .Select(q => new QuestionResponse(
                           q.PublicId.Value,
                           q.Complexity.Description,
                           q.Content,
                           q.CodeQuestionScaffolds
                               .Select(cqs => new CodeScaffoldResponse(cqs.Id, cqs.Code, cqs.Lang.Name))
                               .ToList()))
                       .ToList();
               }, tags: ["questions"]);

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

        string cacheKey = $"Question_{id}";

        QuestionResponse? response = await hybridCache.GetOrCreateAsync<QuestionResponse?>(cacheKey,
            async _ =>
            {
                Question? question = await questionRepository.GetByIdAsync(id);
                if (question is null)
                {
                    return null;
                }

                return new QuestionResponse(
                    question.PublicId.Value,
                    question.Complexity.Description,
                    question.Content,
                    question.CodeQuestionScaffolds
                        .Select(cqs => new CodeScaffoldResponse(cqs.Id, cqs.Code, cqs.Lang.Name))
                        .ToList());
            }, tags: ["questions"]);

        if (response is null)
        {
            return NotFound($"Question with ID {id} was not found.");
        }

        return Ok(response);
    }
}

