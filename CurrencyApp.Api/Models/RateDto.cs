namespace CurrencyApp.Api.Models;

public class RateDto
{
    public DateTime Date { get; set; }
    public decimal Rate { get; set; }
    public decimal? Change { get; set; }
    public int Scale { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}