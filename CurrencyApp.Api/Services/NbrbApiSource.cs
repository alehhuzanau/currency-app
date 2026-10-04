using CurrencyApp.Api.Models;

using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Caching.Memory;

namespace CurrencyApp.Api.Services;

public class NbrbApiSource : CurrencyRateSourceBase
{
    private const string NbrbBaseUrl = "https://api.nbrb.by";
    private const string CurrenciesPath = "/exrates/currencies";
    private const string DynamicsPathPattern = "/exrates/rates/dynamics/{0}?startdate={1:yyyy-MM-dd}&enddate={2:yyyy-MM-dd}";
    private const string CurrentRatePathPattern = "/exrates/rates/{0}?parammode=2";

    private const string RateCacheKeyPattern = "nbrb:rate:{0}";
    private static readonly TimeSpan RateCacheDuration = TimeSpan.FromHours(1);

    private static readonly JsonSerializerOptions JsonOptions = new() 
    { 
        PropertyNameCaseInsensitive = true 
    };

    private readonly HttpClient _httpClient;
    private readonly ILogger<NbrbApiSource> _logger;
    private readonly IMemoryCache _cache;

    public NbrbApiSource(HttpClient httpClient, ILogger<NbrbApiSource> logger, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _logger = logger;
        _cache = cache;
    }

    public override async Task<IReadOnlyList<CurrencyDto>> GetCurrenciesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var url = NbrbBaseUrl + CurrenciesPath;
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("НБРБ вернул статус {Status}", response.StatusCode);
                return Array.Empty<CurrencyDto>();
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var raw = JsonSerializer.Deserialize<List<NbrbCurrency>>(json, JsonOptions) ?? new();

            var today = DateTime.UtcNow.Date;

            return raw
                .Where(c => c.CurDateEnd == null || c.CurDateEnd >= today)
                .Select(c => new CurrencyDto
                {
                    Id = c.CurId,
                    Code = c.CurAbbreviation,
                    Name = c.CurName,
                    Scale = c.CurScale
                })
                .ToList();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Не удалось получить список валют из НБРБ");
            return Array.Empty<CurrencyDto>();
        }
    }

    public override async Task<RatesResponseDto?> GetRatesAsync(
        string code,
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        var currencies = await GetCurrenciesAsync(cancellationToken);
        var currency = currencies.FirstOrDefault(c =>
            string.Equals(c.Code, code, StringComparison.OrdinalIgnoreCase));

        if (currency is null)
        {
            _logger.LogWarning("Валюта {Code} не найдена", code);
            return null;
        }

        var firstDay = new DateTime(year, month, 1);
        var lastDay = firstDay.AddMonths(1).AddDays(-1);
        var requestStart = firstDay.AddDays(-1);

        var url = NbrbBaseUrl + string.Format(DynamicsPathPattern, currency.Id, requestStart, lastDay);

        try
        {
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("НБРБ вернул статус {Status} для {Code}", response.StatusCode, code);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var raw = JsonSerializer.Deserialize<List<NbrbRate>>(json, JsonOptions) ?? new();

            if (raw.Count == 0)
            {
                _logger.LogWarning("Нет данных для {Code} за {Year}-{Month:00}", code, year, month);
                return null;
            }

            raw.Sort((a, b) => a.Date.CompareTo(b.Date));

            var scale = currency.Scale > 0 ? currency.Scale : 1;

            var rates = new List<RateDto>(raw.Count);
            for (int i = 0; i < raw.Count; i++)
            {
                var current = raw[i];
                var ratePerUnit = current.OfficialRate / scale;

                decimal? change = null;
                if (i > 0)
                {
                    var previous = raw[i - 1];
                    var previousRatePerUnit = previous.OfficialRate / scale;
                    change = Math.Round(ratePerUnit - previousRatePerUnit, RateDecimals);
                }

                if (current.Date.Year == year && current.Date.Month == month)
                {
                    rates.Add(new RateDto
                    {
                        Date = current.Date,
                        Rate = Math.Round(ratePerUnit, RateDecimals),
                        Change = change,
                        Scale = scale,
                        Code = currency.Code,
                        Name = currency.Name
                    });
                }
            }

            return new RatesResponseDto
            {
                Code = currency.Code,
                Name = currency.Name,
                Year = year,
                Month = month,
                Rates = rates
            };
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Ошибка получения курсов {Code} за {Year}-{Month:00}", code, year, month);
            return null;
        }
    }

    public override async Task<ConversionRateDto?> GetCurrentRateAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (IsByn(code))
        {
            return CreateBynRate();
        }

        var uppercaseCode = code.ToUpperInvariant();
        var cacheKey = string.Format(RateCacheKeyPattern, uppercaseCode);

        if (_cache.TryGetValue(cacheKey, out ConversionRateDto? cachedRate) && cachedRate is not null)
        {
            _logger.LogDebug("Курс {Code} взят из кэша", uppercaseCode);
            return cachedRate;
        }

        var url = NbrbBaseUrl + string.Format(CurrentRatePathPattern, code);

        try
        {
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("НБРБ вернул статус {Status} для {Code}", response.StatusCode, code);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var raw = JsonSerializer.Deserialize<NbrbCurrentRate>(json, JsonOptions);

            if (raw is null)
            {
                _logger.LogWarning("Пустой ответ для {Code}", code);
                return null;
            }

            var scale = raw.CurScale > 0 ? raw.CurScale : 1;

            var rate = new ConversionRateDto
            {
                Code = raw.CurAbbreviation,
                Name = raw.CurName,
                Rate = Math.Round(raw.CurOfficialRate / scale, RateDecimals),
                Date = raw.Date.Date,
                Scale = scale
            };

            _cache.Set(cacheKey, rate, RateCacheDuration);
            _logger.LogDebug("Курс {Code} получен из НБРБ и закэширован на {Duration}", uppercaseCode, RateCacheDuration);

            return rate;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Ошибка получения курса {Code}", code);
            return null;
        }
    }

    private class NbrbCurrency
    {
        [JsonPropertyName("Cur_ID")]
        public int CurId { get; set; }

        [JsonPropertyName("Cur_Abbreviation")]
        public string CurAbbreviation { get; set; } = string.Empty;

        [JsonPropertyName("Cur_Name")]
        public string CurName { get; set; } = string.Empty;

        [JsonPropertyName("Cur_Scale")]
        public int CurScale { get; set; }

        [JsonPropertyName("Cur_DateEnd")]
        public DateTime? CurDateEnd { get; set; }
    }

    private class NbrbRate
    {
        [JsonPropertyName("Date")]
        public DateTime Date { get; set; }

        [JsonPropertyName("Cur_OfficialRate")]
        public decimal OfficialRate { get; set; }
    }

    private class NbrbCurrentRate
    {
        [JsonPropertyName("Cur_Abbreviation")]
        public string CurAbbreviation { get; set; } = string.Empty;

        [JsonPropertyName("Cur_Name")]
        public string CurName { get; set; } = string.Empty;

        [JsonPropertyName("Cur_Scale")]
        public int CurScale { get; set; } = 1;

        [JsonPropertyName("Cur_OfficialRate")]
        public decimal CurOfficialRate { get; set; }

        [JsonPropertyName("Date")]
        public DateTime Date { get; set; }
    }
}