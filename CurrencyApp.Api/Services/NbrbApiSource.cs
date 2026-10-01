using CurrencyApp.Api.Models;

using System.Text.Json;
using System.Text.Json.Serialization;

namespace CurrencyApp.Api.Services;

public class NbrbApiSource : ICurrencyRateSource
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NbrbApiSource> _logger;

    public NbrbApiSource(HttpClient httpClient, ILogger<NbrbApiSource> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CurrencyDto>> GetCurrenciesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("https://api.nbrb.by/exrates/currencies", cancellationToken);

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

    public async Task<RatesResponseDto?> GetRatesAsync(
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

        var url = $"https://api.nbrb.by/exrates/rates/dynamics/{currency.Id}" +
                  $"?startdate={requestStart:yyyy-MM-dd}&enddate={lastDay:yyyy-MM-dd}";

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
                    change = Math.Round(ratePerUnit - previousRatePerUnit, 4);
                }

                if (current.Date.Year == year && current.Date.Month == month)
                {
                    rates.Add(new RateDto
                    {
                        Date = current.Date,
                        Rate = Math.Round(ratePerUnit, 4),
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

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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
}