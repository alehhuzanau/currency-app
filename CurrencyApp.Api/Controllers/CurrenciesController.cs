using CurrencyApp.Api.Models;
using CurrencyApp.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CurrencyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CurrenciesController : ControllerBase
{
    private readonly ICurrencyRateSource _source;

    public CurrenciesController(ICurrencyRateSource source)
    {
        _source = source;
    }

    /// <summary>
    /// Получить список доступных валют НБРБ.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CurrencyDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CurrencyDto>>> Get(CancellationToken cancellationToken)
    {
        var currencies = await _source.GetCurrenciesAsync(cancellationToken);
        return Ok(currencies);
    }
}