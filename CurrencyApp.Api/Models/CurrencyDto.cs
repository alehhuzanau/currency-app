namespace CurrencyApp.Api.Models;

public class CurrencyDto
{
	public int Id { get; set; }
	public string Code { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;
	public int Scale { get; set; }
}