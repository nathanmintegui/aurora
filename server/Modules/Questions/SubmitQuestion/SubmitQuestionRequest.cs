using System.ComponentModel.DataAnnotations;

namespace Server.Modules.Questions.SubmitQuestion;

public class SubmitQuestionRequest
{
    [Required(ErrorMessage = "The {0} value cannot be null.")]
    [MinLength(1, ErrorMessage = "The {0} value cannot be empty.")]
    public required string Code { get; set; }

    [Required(ErrorMessage = "The {0} value cannot be null.")]
    public required int Lang { get; set; }

    public Guid UserId { get; set; }
}
