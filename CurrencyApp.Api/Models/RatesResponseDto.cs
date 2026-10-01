namespace CurrencyApp.Api.Models;

public class RatesResponseDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public IReadOnlyList<RateDto> Rates { get; set; } = Array.Empty<RateDto>();
}