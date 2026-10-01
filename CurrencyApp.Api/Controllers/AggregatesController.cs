using CurrencyApp.Api.Models;
using CurrencyApp.Api.Services;

using Microsoft.AspNetCore.Mvc;

namespace CurrencyApp.Api.Controllers;

[ApiController]
[Route("api/rates/[controller]")]
public class AggregatesController : ControllerBase
{
    private readonly ICurrencyRateSource _source;

    public AggregatesController(ICurrencyRateSource source)
    {
        _source = source;
    }

    /// <summary>
    /// Получить агрегированные значения (средний, мин, макс курс) за месяц.
    /// </summary>
    /// <param name="code">Код валюты, например USD</param>
    /// <param name="year">Год, например 2026</param>
    /// <param name="month">Месяц от 1 до 12</param>
    [HttpGet]
    [ProducesResponseType(typeof(AggregatesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AggregatesDto>> Get(
        [FromQuery] string code,
        [FromQuery] int year,
        [FromQuery] int month,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest("Параметр 'code' обязателен.");
        }

        if (year < 2000 || year > 2100)
        {
            return BadRequest("Параметр 'year' должен быть в диапазоне 2000–2100.");
        }

        if (month < 1 || month > 12)
        {
            return BadRequest("Параметр 'month' должен быть в диапазоне 1–12.");
        }

        var result = await _source.GetAggregatesAsync(code, year, month, cancellationToken);

        if (result is null)
        {
            return NotFound($"Агрегаты для валюты '{code}' за {year}-{month:00} не найдены.");
        }

        return Ok(result);
    }
}