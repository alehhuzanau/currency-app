using CurrencyApp.Api.Models;
using CurrencyApp.Api.Services;
using CurrencyApp.Api.Constants;

using Microsoft.AspNetCore.Mvc;

namespace CurrencyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RatesController : ControllerBase
{
    private readonly ICurrencyRateSource _source;

    public RatesController(ICurrencyRateSource source)
    {
        _source = source;
    }

    /// <summary>
    /// Получить курсы валюты за выбранный месяц с изменением по дням.
    /// </summary>
    /// <param name="code">Код валюты, например USD</param>
    /// <param name="year">Год, например 2026</param>
    /// <param name="month">Месяц от 1 до 12</param>
    [HttpGet]
    [ProducesResponseType(typeof(RatesResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RatesResponseDto>> Get(
        [FromQuery] string code,
        [FromQuery] int year,
        [FromQuery] int month,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest("Параметр 'code' обязателен.");
        }

        if (!RequestValidator.IsValidYear(year))
        {
            return BadRequest("Параметр 'year' должен быть в диапазоне 2000–2100.");
        }

        if (!RequestValidator.IsValidMonth(month))
        {
            return BadRequest("Параметр 'month' должен быть в диапазоне 1–12.");
        }

        var result = await _source.GetRatesAsync(code, year, month, cancellationToken);

        if (result is null)
        {
            return NotFound($"Курсы для валюты '{code}' за {year}-{month:00} не найдены.");
        }

        return Ok(result);
    }
}