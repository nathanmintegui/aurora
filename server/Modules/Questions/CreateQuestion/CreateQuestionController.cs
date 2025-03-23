using System.ComponentModel.DataAnnotations;

using Microsoft.AspNetCore.Mvc;

using Npgsql;

using Server.Database;
using Server.Domain.Models;
using Server.Domain.Models.Shared;
using Server.Modules.Questions.Infrastructure;

namespace Server.Modules.Questions.CreateQuestion;

[ApiController]
[Route("/questions")]
public class CreateQuestionController(
    ILogger<CreateQuestionController> logger,
    IUnitOfWork unitOfWork,
    IQuestionRepository questionRepository
) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuestionRequest request)
    {
        logger.LogInformation("{Time} | POST /questions", DateTime.Now.ToString("HH:mm:ss"));


        List<ValidationResult> resultadoValidacao = new();
        ValidationContext contexto = new(request, null, null);
        Validator.TryValidateObject(request, contexto, resultadoValidacao, true);

        if (resultadoValidacao.Count > 0)
        {
            return BadRequest();
        }

        Result<Complexity> complexityResult = Complexity.FromId(request.ComplexityId);
        if (complexityResult.IsFailure)
        {
            return BadRequest(complexityResult.Error.Message);
        }

        Question question = Question.Create(new NonEmptyString(request.Content), complexityResult.Value);

        unitOfWork.BeginTransaction();
        try
        {
            await questionRepository.AddAsync(question);
        }
        catch (NpgsqlException e)
        {
            logger.LogWarning(e, "Failed to persist changes.");
            unitOfWork.Rollback();
        }
        finally
        {
            unitOfWork.Dispose();
        }

        Response.Headers.Append("Location", $"/questions/${question.PublicId.Value}");

        return Created();
    }
}
