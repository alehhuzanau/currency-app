namespace CurrencyApp.Api.Models;

public class ConversionResponseDto
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Result { get; set; }

    public IReadOnlyList<ConversionRateDto> ConversionRates { get; set; } = Array.Empty<ConversionRateDto>();

    public DateTime CalculatedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}