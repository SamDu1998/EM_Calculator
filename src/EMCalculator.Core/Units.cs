using System.Globalization;

namespace EMCalculator.Core;

public static class Units
{
    public static double Scale(string? unit) => unit switch
    {
        null or "" or "Hz" or "m" or "m²" => 1,
        "kHz" => 1e3, "MHz" => 1e6, "GHz" => 1e9,
        "km" => 1e3, "cm" => 1e-2, "mm" => 1e-3, "µm" => 1e-6, "mil" => 25.4e-6,
        "cm²" => 1e-4,
        _ => throw new ArgumentException("Unknown unit.", nameof(unit))
    };

    public static double Parse(string raw, string? unit = null)
    {
        // Accept decimal and scientific notation consistently, independent of OS locale.
        if (!double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double value))
            throw new CalculationException("invalid_number");
        value *= Scale(unit);
        if (!double.IsFinite(value)) throw new CalculationException("invalid_number");
        return value;
    }

    public static (double Value, string Unit) Frequency(double hz) =>
        hz >= 1e9 ? (hz / 1e9, "GHz") : hz >= 1e6 ? (hz / 1e6, "MHz") : hz >= 1e3 ? (hz / 1e3, "kHz") : (hz, "Hz");
}
