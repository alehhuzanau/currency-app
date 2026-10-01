using CurrencyApp.Api.Models;

namespace CurrencyApp.Api.Services;

public interface ICurrencyRateSource
{
    Task<IReadOnlyList<CurrencyDto>> GetCurrenciesAsync(CancellationToken cancellationToken = default);

    Task<RatesResponseDto?> GetRatesAsync(
        string code,
        int year,
        int month,
        CancellationToken cancellationToken = default);
}