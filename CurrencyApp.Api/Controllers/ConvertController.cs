using CurrencyApp.Api.Models;
using CurrencyApp.Api.Services;

using Microsoft.AspNetCore.Mvc;

namespace CurrencyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConvertController : ControllerBase
{
    private readonly ICurrencyRateSource _source;

    public ConvertController(ICurrencyRateSource source)
    {
        _source = source;
    }

    /// <summary>
    /// Конвертировать сумму из одной валюты в другую по актуальному курсу НБРБ.
    /// </summary>
    /// <param name="from">Код исходной валюты, например USD или BYN</param>
    /// <param name="to">Код целевой валюты, например EUR или BYN</param>
    /// <param name="amount">Сумма для конвертации (положительное число)</param>
    [HttpGet]
    [ProducesResponseType(typeof(ConversionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConversionResponseDto>> Get(
        [FromQuery] string from,
        [FromQuery] string to,
        [FromQuery] decimal amount,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(to))
        {
            return BadRequest("Параметры 'from' и 'to' обязательны.");
        }

        if (amount <= 0)
        {
            return BadRequest("Параметр 'amount' должен быть положительным числом.");
        }

        var result = await _source.ConvertAsync(from, to, amount, cancellationToken);

        if (result is null)
        {
            return NotFound($"Не удалось выполнить конвертацию {from} → {to}.");
        }

        return Ok(result);
    }
}