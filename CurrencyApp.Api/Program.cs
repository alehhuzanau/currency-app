using CurrencyApp.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var dataSourceType = builder.Configuration["DataSource:Type"] ?? "Api";

if (string.Equals(dataSourceType, "File", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<ICurrencyRateSource, FileCurrencyRateSource>();
}
else
{
    builder.Services.AddHttpClient<ICurrencyRateSource, NbrbApiSource>();
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();