using System.Diagnostics;
using System.Text;

using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

using RabbitMQ.Client;
using RabbitMQ.Client.Exceptions;

using Server.Domain.Models;
using Server.Domain.Models.Shared;

namespace Server.Modules.Questions.SubmitQuestion;

[ApiController]
[Route("/questions")]
public class SubmitQuestionController(ILogger<SubmitQuestionController> logger) : ControllerBase
{
    [HttpPost]
    [Route("{questionId:guid}/submit")]
    public async Task<IActionResult> Submit([FromRoute] Guid questionId, [FromBody] SubmitQuestionRequest request)
    {
        /*
         * NOTE: Should also retrieve the user ID by token or other way of auth.
         * */
        Guid userId = Guid.Empty;
        if (request.UserId != Guid.Empty)
        {
            userId = request.UserId;
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest("Field code should not be null or empty.");
        }

        if (questionId == Guid.Empty)
        {
            return BadRequest("Question ID should not be empty.");
        }

        Result<Lang> langResult = Lang.FromId(request.Lang);
        if (langResult.IsFailure)
        {
            return BadRequest(langResult.Error.Message);
        }

        SubmittedQuestion message = null!;
        try
        {
            ConnectionFactory factory = new() { HostName = "localhost" };
            await using IConnection connection = await factory.CreateConnectionAsync();
            await using IChannel channel = await connection.CreateChannelAsync();

            await channel.QueueDeclareAsync(
                langResult.Value.Name,
                false,
                false,
                false,
                null
            );

            message = new SubmittedQuestion(
                Guid.NewGuid(),
                questionId,
                userId,
                langResult.Value.Name,
                request.Code
            );

            string messageJson = JsonConvert.SerializeObject(message);
            byte[]? body = Encoding.UTF8.GetBytes(messageJson);
            Debug.Assert(body is not null && body.Any());

            await channel.BasicPublishAsync(
                string.Empty,
                langResult.Value.Name,
                body
            );

            logger.LogInformation("[x] Sent {Message}", messageJson);
        }
        catch (BrokerUnreachableException brokerEx)
        {
            logger.LogWarning(brokerEx, "Failed to reach broker and create a connection.");
            return new StatusCodeResult(StatusCodes.Status500InternalServerError);
        }
        catch (EncoderFallbackException enconderEx)
        {
            logger.LogWarning(enconderEx, "Failed to encode message to queue.");
            return new StatusCodeResult(StatusCodes.Status500InternalServerError);
        }

        /*
         * NOTE: Add an endpoint to verify the status.
         * */
        Response.Headers.Append("Location", $"/status/{message.RequestId}");

        return Accepted();
    }
}
