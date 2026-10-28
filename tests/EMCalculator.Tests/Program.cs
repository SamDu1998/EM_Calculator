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
            "rectangularPatch" => Calculations.RectangularPatch(V("frequencyHz"), V("er"), V("substrateHeightM")),
            "uniformLinearArray" => Calculations.UniformLinearArray(V("frequencyHz"), V("elementCount"), V("spacingRatio"), V("scanAngleDegrees")),
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
    Test($"patch rejects frequency {invalid}", () => Reject("frequency_not_positive", () => Calculations.RectangularPatch(invalid, 4.4, 0.0016)));
    Test($"patch rejects substrate height {invalid}", () => Reject("height_not_positive", () => Calculations.RectangularPatch(2.4e9, 4.4, invalid)));
    Test($"array rejects frequency {invalid}", () => Reject("frequency_not_positive", () => Calculations.UniformLinearArray(invalid, 8, 0.5, 0)));
    Test($"array rejects spacing ratio {invalid}", () => Reject("spacing_ratio_not_positive", () => Calculations.UniformLinearArray(10e9, 8, invalid, 0)));
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
    Test($"patch rejects er {invalid}", () => Reject("er_less_than_one", () => Calculations.RectangularPatch(2.4e9, invalid, 0.0016)));
}
Test("bandwidth rejects reversed limits", () => Reject("fmax_not_greater_than_fmin", () => Calculations.Bandwidth(2, 1)));
Test("bandwidth rejects equal limits", () => Reject("fmax_not_greater_than_fmin", () => Calculations.Bandwidth(2, 2)));
Test("bandwidth avoids center overflow", () => Near(Calculations.Bandwidth(1e308, 1.5e308).CenterHz, 1.25e308));
Test("coaxial rejects reversed diameters", () => Reject("outer_not_greater_than_inner", () => Calculations.Coaxial(2, 1, 1)));
Test("SIW rejects impossible equivalent width", () => Reject("width_too_small_for_vias", () => Calculations.Siw(1e10, 1, 1e-6)));
Test("patch rejects non-positive resonant length", () => Reject("patch_length_not_positive", () => Calculations.RectangularPatch(1e9, 1, 1)));
Test("patch rejects wavelength overflow", () => Reject("out_of_range", () => Calculations.RectangularPatch(double.Epsilon, 4.4, 0.0016)));
Test("patch width and effective length use the stated first-order model", () =>
{
    double frequency = 2.4e9;
    var patch = Calculations.RectangularPatch(frequency, 4.4, 0.0016);
    Assert(patch.WidthM > patch.LengthM && patch.LengthM > 0 && patch.LengthExtensionM > 0);
    Assert(patch.EpsilonEff is >= 1 and <= 4.4);
    Near(patch.LengthM, patch.EffectiveLengthM - 2 * patch.LengthExtensionM);
    Near(2 * patch.EffectiveLengthM * Math.Sqrt(patch.EpsilonEff) * frequency, Calculations.SpeedOfLight);
});
Test("patch dimensions scale inversely with frequency when h scales too", () =>
{
    var low = Calculations.RectangularPatch(2.4e9, 4.4, 0.0016);
    var high = Calculations.RectangularPatch(4.8e9, 4.4, 0.0008);
    Near(high.WidthM * 2, low.WidthM);
    Near(high.LengthM * 2, low.LengthM);
    Near(high.LengthExtensionM * 2, low.LengthExtensionM);
    Near(high.EpsilonEff, low.EpsilonEff);
});
Test("array supports minimum and maximum element counts", () =>
{
    Assert(Calculations.UniformLinearArray(10e9, 2, 0.5, 0).ElementCount == 2);
    Assert(Calculations.UniformLinearArray(10e9, 32, 0.5, 0).ElementCount == 32);
});
foreach (double invalid in new[] { 0, 1, 1.5, 33, double.NaN, double.PositiveInfinity, double.NegativeInfinity })
    Test($"array rejects element count {invalid}", () => Reject("element_count_invalid", () => Calculations.UniformLinearArray(10e9, invalid, 0.5, 0)));
foreach (double invalid in new[] { -90.0001, 90.0001, double.NaN, double.PositiveInfinity, double.NegativeInfinity })
    Test($"array rejects scan angle {invalid}", () => Reject("scan_angle_out_of_range", () => Calculations.UniformLinearArray(10e9, 8, 0.5, invalid)));
Test("array broadside half-wave spacing has no grating lobes and zero phase", () =>
{
    var array = Calculations.UniformLinearArray(10e9, 8, 0.5, 0);
    Assert(!array.GratingLobesPossible);
    Near(array.ProgressivePhaseDegrees, 0);
    Near(array.GratingLobeLimitSpacingRatio, 1);
    Near(array.ApertureLengthM, (array.ElementCount - 1) * array.ElementSpacingM);
});
Test("array phase step steers symmetrically about broadside", () =>
{
    var positive = Calculations.UniformLinearArray(5.8e9, 16, 0.5, 45);
    var negative = Calculations.UniformLinearArray(5.8e9, 16, 0.5, -45);
    Near(positive.ProgressivePhaseDegrees, 360 * 0.5 * Math.Sin(45 * Math.PI / 180));
    Near(positive.ProgressivePhaseDegrees, -negative.ProgressivePhaseDegrees);
    Assert(!positive.GratingLobesPossible && !negative.GratingLobesPossible);
});
Test("array warns at the scan-dependent grating-lobe threshold", () =>
{
    double scan = 60;
    double threshold = 1 / (1 + Math.Abs(Math.Sin(scan * Math.PI / 180)));
    Assert(!Calculations.UniformLinearArray(10e9, 8, threshold * (1 - 1e-9), scan).GratingLobesPossible);
    Assert(Calculations.UniformLinearArray(10e9, 8, threshold, scan).GratingLobesPossible);
});
Test("array endfire scan warns at half-wave spacing", () =>
    Assert(Calculations.UniformLinearArray(10e9, 8, 0.5, 90).GratingLobesPossible));
Test("array phase increment wraps to the principal 360-degree interval", () =>
{
    var array = Calculations.UniformLinearArray(10e9, 8, 1.2, 30);
    Assert(array.ProgressivePhaseDegrees is >= -180 and <= 180);
    Near(Math.IEEERemainder(360 * 1.2 * Math.Sin(30 * Math.PI / 180), 360), array.ProgressivePhaseDegrees);
});
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
