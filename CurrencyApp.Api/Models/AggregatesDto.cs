namespace CurrencyApp.Api.Models;

public class AggregatesDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }

    public decimal Average { get; set; }
    public decimal Max { get; set; }
    public decimal Min { get; set; }
}