using System.Text.Json;
using EMCalculator.Core;

// Dependency-free regression runner: a failed assertion returns a non-zero exit code in CI.
int passed = 0, failed = 0;
void Test(string name, Action test)
{
    try { test(); passed++; }
    catch (Exception ex) { failed++; Console.Error.WriteLine($"FAIL {name}: {ex.Message}"); }
}
void Assert(bool condition, string message = "Assertion failed")
{
    if (!condition) throw new Exception(message);
}
void Near(double actual, double expected, double relative = 1e-10)
{
    Assert(double.IsFinite(actual) && Math.Abs(actual - expected) <= Math.Max(1e-12, Math.Abs(expected) * relative),
        $"Expected {expected:R}, received {actual:R}");
}
void Reject(string code, Action action)
{
    try { action(); }
    catch (CalculationException ex) { Assert(ex.Code == code, $"Expected {code}, received {ex.Code}"); return; }
    throw new Exception($"Expected {code} to be rejected");
}
using var fixtures = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", "calculations.json")));
var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
foreach (var group in fixtures.RootElement.EnumerateObject())
foreach (var fixture in group.Value.EnumerateArray())
{
    Test($"{group.Name}/{fixture.GetProperty("name").GetString()}", () =>
    {
        double V(string name) => fixture.GetProperty(name).GetDouble();
        object result = group.Name switch
        {
            "bandwidth" => Calculations.Bandwidth(V("fminHz"), V("fmaxHz")),
            "apertureEfficiency" => Calculations.Aperture(V("frequencyHz"), V("gainDbi"), V("physicalAreaM2")),
            "wavelength" => Calculations.Wavelength(V("frequencyHz"), V("er")),
            "microstrip" => Calculations.Microstrip(V("widthM"), V("heightM"), V("er")),
            "coaxial" => Calculations.Coaxial(V("innerDiameterM"), V("outerDiameterM"), V("er")),
            "cpw" or "gcpw" => Calculations.Coplanar(V("widthM"), V("gapM"), V("heightM"), V("er"), group.Name == "gcpw"),
            "siw" => Calculations.Siw(V("frequencyHz"), V("er"), V("widthM")),
            _ => throw new Exception($"Unknown fixture group {group.Name}")
        };
        var actual = JsonSerializer.SerializeToElement(result, result.GetType(), options);
        foreach (var expected in fixture.GetProperty("expected").EnumerateObject())
        {
            var value = actual.GetProperty(expected.Name);
            if (expected.Value.ValueKind == JsonValueKind.Number) Near(value.GetDouble(), expected.Value.GetDouble());
            else Assert(value.GetBoolean() == expected.Value.GetBoolean(), expected.Name);
        }
    });
}
foreach (double invalid in new[] { 0, -1, double.NaN, double.PositiveInfinity, double.NegativeInfinity })
{
    Test($"bandwidth rejects minimum {invalid}", () => Reject("fmin_not_positive", () => Calculations.Bandwidth(invalid, 2)));
    Test($"wavelength rejects frequency {invalid}", () => Reject("frequency_not_positive", () => Calculations.Wavelength(invalid, 1)));
    Test($"aperture rejects area {invalid}", () => Reject("area_not_positive", () => Calculations.Aperture(1e9, 10, invalid)));
    Test($"microstrip rejects width {invalid}", () => Reject("width_not_positive", () => Calculations.Microstrip(invalid, 1, 1)));
    Test($"microstrip rejects height {invalid}", () => Reject("height_not_positive", () => Calculations.Microstrip(1, invalid, 1)));
    Test($"coaxial rejects inner {invalid}", () => Reject("inner_not_positive", () => Calculations.Coaxial(invalid, 2, 1)));
    Test($"coplanar rejects gap {invalid}", () => Reject("gap_not_positive", () => Calculations.Coplanar(1, invalid, 1, 1)));
    Test($"SIW rejects width {invalid}", () => Reject("width_not_positive", () => Calculations.Siw(1e10, 1, invalid)));
}
foreach (double invalid in new[] { 0.9, double.NaN, double.PositiveInfinity })
{
    Test($"wavelength rejects er {invalid}", () => Reject("er_less_than_one", () => Calculations.Wavelength(1e9, invalid)));
    Test($"microstrip rejects er {invalid}", () => Reject("er_less_than_one", () => Calculations.Microstrip(1, 1, invalid)));
    Test($"coaxial rejects er {invalid}", () => Reject("er_less_than_one", () => Calculations.Coaxial(1, 2, invalid)));
    Test($"CPW rejects er {invalid}", () => Reject("er_less_than_one", () => Calculations.Coplanar(1, 1, 1, invalid)));
    Test($"GCPW rejects er {invalid}", () => Reject("er_less_than_one", () => Calculations.Coplanar(1, 1, 1, invalid, true)));
    Test($"SIW rejects er {invalid}", () => Reject("er_less_than_one", () => Calculations.Siw(1e10, invalid, 0.01)));
}
Test("bandwidth rejects reversed limits", () => Reject("fmax_not_greater_than_fmin", () => Calculations.Bandwidth(2, 1)));
Test("bandwidth rejects equal limits", () => Reject("fmax_not_greater_than_fmin", () => Calculations.Bandwidth(2, 2)));
Test("bandwidth avoids center overflow", () => Near(Calculations.Bandwidth(1e308, 1.5e308).CenterHz, 1.25e308));
Test("coaxial rejects reversed diameters", () => Reject("outer_not_greater_than_inner", () => Calculations.Coaxial(2, 1, 1)));
Test("SIW rejects impossible equivalent width", () => Reject("width_too_small_for_vias", () => Calculations.Siw(1e10, 1, 1e-6)));
Test("aperture rejects infinite gain", () => Reject("gain_not_finite", () => Calculations.Aperture(1e9, double.PositiveInfinity, 1)));
Test("aperture rejects gain overflow", () => Reject("out_of_range", () => Calculations.Aperture(1e9, 4000, 1)));
Test("microstrip warns outside validated range", () => Assert(Calculations.Microstrip(0.000001, 1, 4.4).OutsideValidatedRange));
Test("CPW thick substrate limit", () => Near(Calculations.Coplanar(0.0005, 0.00025, 1, 9.8).EpsilonEff, 5.4, 1e-6));
Test("GCPW thick substrate limit", () => Near(Calculations.Coplanar(0.0005, 0.00025, 1, 9.8, true).EpsilonEff, 5.4, 1e-6));
Test("CPW sinh overflow limit", () => Assert(double.IsFinite(Calculations.Coplanar(1, 0.5, 0.001, 4.4).Z0Ohm)));
Test("air CPW permittivity", () => Near(Calculations.Coplanar(0.0005, 0.00025, 0.000635, 1).EpsilonEff, 1));
Test("ground plane lowers impedance", () => Assert(Calculations.Coplanar(0.0005, 0.00025, 0.000635, 9.8, true).Z0Ohm < Calculations.Coplanar(0.0005, 0.00025, 0.000635, 9.8).Z0Ohm));
Test("wider CPW gap raises impedance", () => Assert(Calculations.Coplanar(0.0005, 0.0005, 0.000635, 9.8).Z0Ohm > Calculations.Coplanar(0.0005, 0.0001, 0.000635, 9.8).Z0Ohm));
Test("elliptic integral K(0)", () => Near(Calculations.EllipticK(0), Math.PI / 2));
Test("elliptic integral K(0.5)", () => Near(Calculations.EllipticK(0.5), 1.685750354812596));
Test("elliptic ratio at symmetric modulus", () => Near(Calculations.EllipticRatio(Math.Sqrt(0.5)), 1));
Test("elliptic rejects endpoint", () => Reject("out_of_range", () => Calculations.EllipticK(1)));
Test("GHz conversion", () => Near(Units.Parse("2.4", "GHz"), 2.4e9));
Test("mil conversion", () => Near(Units.Parse("10", "mil"), 0.000254));
Test("area conversion", () => Near(Units.Parse("10000", "cm²"), 1));
Test("scientific notation", () => Near(Units.Parse("1e-3", "mm"), 1e-6));
foreach (string invalid in new[] { "", " ", "abc", "NaN", "Infinity", "1e999", "1,234" })
    Test($"numeric parsing rejects '{invalid}'", () => Reject("invalid_number", () => Units.Parse(invalid)));
Test("unit conversion rejects overflow", () => Reject("invalid_number", () => Units.Parse("1e308", "GHz")));
Test("frequency display uses appropriate magnitude", () => Assert(Units.Frequency(2.4e9) == (2.4, "GHz") && Units.Frequency(100) == (100, "Hz")));
Console.WriteLine($"Passed: {passed}; failed: {failed}");
return failed == 0 ? 0 : 1;
