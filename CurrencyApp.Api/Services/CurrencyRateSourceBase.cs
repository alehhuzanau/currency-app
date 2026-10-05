using System.Globalization;

using CurrencyApp.Api.Models;

namespace CurrencyApp.Api.Services;

public abstract class CurrencyRateSourceBase : ICurrencyRateSource
{
    protected const string BynCode = "BYN";
    protected const string BynName = "Белорусский рубль";
    protected const decimal BynRate = 1m;
    protected const int RateDecimals = 4;

    public abstract Task<IReadOnlyList<CurrencyDto>> GetCurrenciesAsync(
        CancellationToken cancellationToken = default);

    public abstract Task<RatesResponseDto?> GetRatesAsync(
        string code,
        int year,
        int month,
        CancellationToken cancellationToken = default);

    public abstract Task<ConversionRateDto?> GetCurrentRateAsync(
        string code,
        CancellationToken cancellationToken = default);

    public virtual async Task<AggregatesDto?> GetAggregatesAsync(
        string code,
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        var ratesResponse = await GetRatesAsync(code, year, month, cancellationToken);

        if (ratesResponse is null || ratesResponse.Rates.Count == 0)
        {
            return null;
        }

        var rates = ratesResponse.Rates;
        var averageRate = Math.Round(rates.Average(r => r.Rate), RateDecimals);
        var maxRate = rates.MaxBy(r => r.Rate)!;
        var minRate = rates.MinBy(r => r.Rate)!;

        return new AggregatesDto
        {
            Code = ratesResponse.Code,
            Name = ratesResponse.Name,
            Year = year,
            Month = month,
            Average = averageRate,
            Max = maxRate.Rate,
            Min = minRate.Rate
        };
    }

    public virtual async Task<ConversionResponseDto?> ConvertAsync(
        string from,
        string to,
        decimal amount,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0)
        {
            return null;
        }

        var fromRate = await GetCurrentRateAsync(from, cancellationToken);
        var toRate = await GetCurrentRateAsync(to, cancellationToken);

        if (fromRate is null || toRate is null)
        {
            return null;
        }

        var result = Math.Round(amount * fromRate.Rate / toRate.Rate, RateDecimals);

        var rates = new List<ConversionRateDto>();
        if (!string.Equals(fromRate.Code, BynCode, StringComparison.OrdinalIgnoreCase))
        {
            rates.Add(fromRate);
        }
        if (!string.Equals(toRate.Code, BynCode, StringComparison.OrdinalIgnoreCase))
        {
            rates.Add(toRate);
        }

        return new ConversionResponseDto
        {
            From = fromRate.Code,
            To = toRate.Code,
            Amount = amount,
            Result = result,
            ConversionRates = rates,
            CalculatedAt = DateTime.UtcNow,
            Message = BuildMessage(rates)
        };
    }

    protected static ConversionRateDto CreateBynRate()
    {
        return new ConversionRateDto
        {
            Code = BynCode,
            Name = BynName,
            Rate = BynRate,
            Date = DateTime.UtcNow.Date,
            Scale = 1
        };
    }

    protected static bool IsByn(string code) =>
        string.Equals(code, BynCode, StringComparison.OrdinalIgnoreCase);

    protected virtual string BuildMessage(IReadOnlyList<ConversionRateDto> rates)
    {
        if (rates.Count == 0)
        {
            return "Конвертация внутри BYN — курс не требуется.";
        }

        var parts = rates.Select(r =>
            $"1 {r.Code} = {r.Rate.ToString(CultureInfo.InvariantCulture)} BYN");

        return $"Расчёт выполнен по курсу НБРБ на {rates[0].Date:dd.MM.yyyy}: " + string.Join("; ", parts) + ".";
    }
}