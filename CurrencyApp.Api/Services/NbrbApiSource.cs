using System.Text.Json;
using System.Text.Json.Serialization;
using CurrencyApp.Api.Models;

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
}