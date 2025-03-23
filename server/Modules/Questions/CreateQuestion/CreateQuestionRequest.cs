using System.ComponentModel.DataAnnotations;

namespace Server.Modules.Questions.CreateQuestion;

public class CreateQuestionRequest
{
    [Required(ErrorMessage = "The {0} value cannot be null.")]
    [MinLength(1, ErrorMessage = "The {0} value cannot be empty.")]
    public required string Content { get; set; }

    [Required(ErrorMessage = "The {0} value cannot be null.")]
    public required int ComplexityId { get; set; }

    [Required(ErrorMessage = "The {0} value cannot be null.")]
    public required string MainCodeFuncion { get; set; }
};
