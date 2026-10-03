namespace CurrencyApp.Api.Constants;

public static class RequestValidator
{
    public const int MinYear = 2000;
    public const int MaxYear = 2100;
    public const int MinMonth = 1;
    public const int MaxMonth = 12;

    public static bool IsValidYear(int year) => year is >= MinYear and <= MaxYear;
    public static bool IsValidMonth(int month) => month is >= MinMonth and <= MaxMonth;
}