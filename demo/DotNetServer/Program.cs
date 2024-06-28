using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services
  .AddGraphQLServer()
  .AddQueryType<Query>();

var app = builder.Build();

app.MapGraphQL();
app.Run();

public class Country {
  public string name { get; set; } = String.Empty;
  public int areaKM2 { get; set; }
  public int population { get; set; }

  // Calculated field
  public float areaPerPerson { get; set; }
}

public class Query {
  static Query() {
    try {
      using FileStream fs = File.OpenRead("countries.json");
      countries = JsonSerializer.Deserialize<List<Country>>(fs);
    }
    catch (Exception ex) {
      Console.WriteLine($"Error loading countries: {ex.Message}");
    }
  }

  private static readonly List<Country>? countries;

  public List<Country>? Countries(string[]? searchNames) =>
    CalcFields(searchNames != null && countries != null
      ? countries.Where(
        c => searchNames.Any(sn => c.name.Contains(
          sn, StringComparison.CurrentCultureIgnoreCase))).ToList()
      : countries);

  List<Country>? CalcFields(List<Country>? source) {
    if (source != null)
      foreach (var c in source)
        c.areaPerPerson = (float)c.areaKM2 / (float)c.population;
    return source;
  }
}