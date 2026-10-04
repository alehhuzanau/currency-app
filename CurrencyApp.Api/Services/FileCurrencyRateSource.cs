using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using CurrencyApp.Api.Models;

namespace CurrencyApp.Api.Services;

public class FileCurrencyRateSource : CurrencyRateSourceBase
{
    private readonly ILogger<FileCurrencyRateSource> _logger;
    private readonly string _currenciesPath;
    private readonly string _ratesPath;

    private IReadOnlyList<CurrencyDto>? _currenciesCache;
    private IReadOnlyList<CsvRate>? _ratesCache;
    private readonly Lock _lock = new();

    public FileCurrencyRateSource(
        ILogger<FileCurrencyRateSource> logger,
        IWebHostEnvironment env)
    {
        _logger = logger;
        var dataFolder = Path.Combine(env.ContentRootPath, "Data");
        _currenciesPath = Path.Combine(dataFolder, "currencies.csv");
        _ratesPath = Path.Combine(dataFolder, "rates.csv");
    }

    public override Task<IReadOnlyList<CurrencyDto>> GetCurrenciesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(LoadCurrencies());
    }

    public override Task<RatesResponseDto?> GetRatesAsync(
        string code,
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        var currencies = LoadCurrencies();
        var currency = currencies.FirstOrDefault(c =>
            string.Equals(c.Code, code, StringComparison.OrdinalIgnoreCase));

        if (currency is null)
        {
            _logger.LogWarning("Валюта {Code} не найдена в CSV", code);
            return Task.FromResult<RatesResponseDto?>(null);
        }

        var allRates = LoadRates()
            .Where(r => string.Equals(r.Code, currency.Code, StringComparison.OrdinalIgnoreCase))
            .OrderBy(r => r.Date)
            .ToList();

        if (allRates.Count == 0)
        {
            _logger.LogWarning("Нет курсов для {Code} в CSV", code);
            return Task.FromResult<RatesResponseDto?>(null);
        }

        var firstDay = new DateTime(year, month, 1);
        var lastDay = firstDay.AddMonths(1).AddDays(-1);

        var scale = currency.Scale > 0 ? currency.Scale : 1;
        var rates = new List<RateDto>();

        for (int i = 0; i < allRates.Count; i++)
        {
            var current = allRates[i];
            var currentRate = current.OfficialRate / scale;

            decimal? change = null;
            if (i > 0)
            {
                var previous = allRates[i - 1];
                var previousRate = previous.OfficialRate / scale;
                change = Math.Round(currentRate - previousRate, RateDecimals);
            }

            if (current.Date.Year == year && current.Date.Month == month)
            {
                rates.Add(new RateDto
                {
                    Date = current.Date,
                    Rate = Math.Round(currentRate, RateDecimals),
                    Change = change,
                    Scale = scale,
                    Code = currency.Code,
                    Name = currency.Name
                });
            }
        }

        if (rates.Count == 0)
        {
            _logger.LogWarning("Нет курсов для {Code} за {Year}-{Month:00} в CSV", code, year, month);
            return Task.FromResult<RatesResponseDto?>(null);
        }

        return Task.FromResult<RatesResponseDto?>(new RatesResponseDto
        {
            Code = currency.Code,
            Name = currency.Name,
            Year = year,
            Month = month,
            Rates = rates
        });
    }

    public override Task<ConversionRateDto?> GetCurrentRateAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (IsByn(code))
        {
            return Task.FromResult<ConversionRateDto?>(CreateBynRate());
        }

        var currency = LoadCurrencies().FirstOrDefault(c =>
            string.Equals(c.Code, code, StringComparison.OrdinalIgnoreCase));

        if (currency is null)
        {
            return Task.FromResult<ConversionRateDto?>(null);
        }

        var latest = LoadRates()
            .Where(r => string.Equals(r.Code, currency.Code, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(r => r.Date)
            .FirstOrDefault();

        if (latest is null)
        {
            return Task.FromResult<ConversionRateDto?>(null);
        }

        var scale = currency.Scale > 0 ? currency.Scale : 1;

        return Task.FromResult<ConversionRateDto?>(new ConversionRateDto
        {
            Code = currency.Code,
            Name = currency.Name,
            Rate = Math.Round(latest.OfficialRate / scale, RateDecimals),
            Date = latest.Date,
            Scale = scale
        });
    }

    private IReadOnlyList<CurrencyDto> LoadCurrencies()
    {
        if (_currenciesCache is not null)
        {
            return _currenciesCache;
        }

        lock (_lock)
        {
            if (_currenciesCache is not null)
            {
                return _currenciesCache;
            }

            if (!File.Exists(_currenciesPath))
            {
                _logger.LogError("Файл {Path} не найден", _currenciesPath);
                _currenciesCache = Array.Empty<CurrencyDto>();
                return _currenciesCache;
            }

            using var reader = new StreamReader(_currenciesPath);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));

            var records = csv.GetRecords<CsvCurrency>().ToList();

            _currenciesCache = records
                .Select(r => new CurrencyDto
                {
                    Id = 0,
                    Code = r.Code,
                    Name = r.Name,
                    Scale = r.Scale
                })
                .ToList();

            _logger.LogInformation("Загружено {Count} валют из CSV", _currenciesCache.Count);
            return _currenciesCache;
        }
    }

    private IReadOnlyList<CsvRate> LoadRates()
    {
        if (_ratesCache is not null)
        {
            return _ratesCache;
        }

        lock (_lock)
        {
            if (_ratesCache is not null)
            {
                return _ratesCache;
            }

            if (!File.Exists(_ratesPath))
            {
                _logger.LogError("Файл {Path} не найден", _ratesPath);
                _ratesCache = Array.Empty<CsvRate>();
                return _ratesCache;
            }

            using var reader = new StreamReader(_ratesPath);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));

            _ratesCache = csv.GetRecords<CsvRate>().ToList();

            _logger.LogInformation("Загружено {Count} курсов из CSV", _ratesCache.Count);
            return _ratesCache;
        }
    }

    private class CsvCurrency
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Scale { get; set; }
    }

    private class CsvRate
    {
        public string Code { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal OfficialRate { get; set; }
    }
}