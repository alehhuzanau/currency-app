namespace CurrencyApp.Api.Models;

public class ConversionRateDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public DateTime Date { get; set; }
    public int Scale { get; set; }
}