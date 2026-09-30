using CurrencyApp.Api.Models;

namespace CurrencyApp.Api.Services;

public interface ICurrencyRateSource
{
    Task<IReadOnlyList<CurrencyDto>> GetCurrenciesAsync(CancellationToken cancellationToken = default);
}