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

    Task<AggregatesDto?> GetAggregatesAsync(
        string code,
        int year,
        int month,
        CancellationToken cancellationToken = default);

    Task<ConversionRateDto?> GetCurrentRateAsync(
        string code,
        CancellationToken cancellationToken = default);

    Task<ConversionResponseDto?> ConvertAsync(
        string from,
        string to,
        decimal amount,
        CancellationToken cancellationToken = default);
}