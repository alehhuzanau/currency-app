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

        private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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

    public async Task<AggregatesDto?> GetAggregatesAsync(
        string code,
        int year,
        int month,
        CancellationToken cancellationToken = default) 
    {
        var ratesResponse = await GetRatesAsync(code, year, month, cancellationToken);

        if (ratesResponse is null || ratesResponse.Rates.Count == 0)
        {
            _logger.LogWarning("Нет данных для агрегатов {Code} за {Year}-{Month:00}", code, year, month);
            return null;
        }

        var rates = ratesResponse.Rates;

        var averageRate = Math.Round(rates.Average(r => r.Rate), 4);
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

    public async Task<ConversionRateDto?> GetCurrentRateAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(code, "BYN", StringComparison.OrdinalIgnoreCase))
        {
            return new ConversionRateDto
            {
                Code = "BYN",
                Name = "Белорусский рубль",
                Rate = 1m,
                Date = DateTime.UtcNow.Date,
                Scale = 1
            };
        }

        var url = $"https://api.nbrb.by/exrates/rates/{code}?parammode=2";

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

            return new ConversionRateDto
            {
                Code = raw.CurAbbreviation,
                Name = raw.CurName,
                Rate = Math.Round(raw.CurOfficialRate / scale, 4),
                Date = raw.Date.Date,
                Scale = scale
            };
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Ошибка получения курса {Code}", code);
            return null;
        }
    }

    public async Task<ConversionResponseDto?> ConvertAsync(
        string from,
        string to,
        decimal amount,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0)
        {
            _logger.LogWarning("Некорректная сумма для конвертации: {Amount}", amount);
            return null;
        }

        var fromRate = await GetCurrentRateAsync(from, cancellationToken);
        var toRate = await GetCurrentRateAsync(to, cancellationToken);

        if (fromRate is null || toRate is null)
        {
            _logger.LogWarning("Не удалось получить курс для {From} → {To}", from, to);
            return null;
        }

        var result = amount * fromRate.Rate / toRate.Rate;
        result = Math.Round(result, 4);

        var rates = new List<ConversionRateDto>();

        if (!string.Equals(fromRate.Code, "BYN", StringComparison.OrdinalIgnoreCase))
        {
            rates.Add(fromRate);
        }

        if (!string.Equals(toRate.Code, "BYN", StringComparison.OrdinalIgnoreCase))
        {
            rates.Add(toRate);
        }

        var message = BuildMessage(fromRate, toRate, rates);

        return new ConversionResponseDto
        {
            From = fromRate.Code,
            To = toRate.Code,
            Amount = amount,
            Result = result,
            ConversionRates = rates,
            CalculatedAt = DateTime.UtcNow,
            Message = message
        };
    }

    private static string BuildMessage(
        ConversionRateDto fromRate,
        ConversionRateDto toRate,
        IReadOnlyList<ConversionRateDto> rates)
    {
        if (rates.Count == 0)
        {
            return "Конвертация внутри BYN — курс не требуется.";
        }

        var parts = rates.Select(r =>
            $"1 {r.Code} = {r.Rate} BYN (на {r.Date:dd.MM.yyyy})");

        return "Расчёт выполнен по курсу НБРБ: " + string.Join("; ", parts) + ".";
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