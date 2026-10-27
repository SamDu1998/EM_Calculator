namespace EMCalculator.Core;

public sealed class CalculationException(string code) : ArgumentException(code)
{
    public string Code { get; } = code;
}

public sealed record BandwidthResult(double AbsoluteHz, double CenterHz, double Fractional, double RelativePercent);
public sealed record ApertureResult(double WavelengthM, double EffectiveAreaM2, double EfficiencyPercent, bool ExceedsPhysicalLimit);
public sealed record WavelengthResult(double Lambda0M, double LambdaGM, double HalfLambdaGM, double QuarterLambdaGM, double PhaseVelocityMPerS);
public sealed record LineResult(double Z0Ohm, double EpsilonEff, double PhaseVelocityMPerS, bool OutsideValidatedRange = false);
public sealed record SiwResult(double ViaDiameterM, double ViaPitchM, double EffectiveWidthM, double CutoffFrequencyHz, bool BelowCutoff);
public enum LineType { Microstrip, Cpw, Gcpw, Coaxial }

/// <summary>SI inputs. Quasi-static, lossless transmission-line models; zero conductor thickness.</summary>
public static class Calculations
{
    public const double SpeedOfLight = 299_792_458;
    private static void Positive(double value, string code)
    {
        if (!double.IsFinite(value) || value <= 0) throw new CalculationException(code);
    }
    private static void Permittivity(double er)
    {
        if (!double.IsFinite(er) || er < 1) throw new CalculationException("er_less_than_one");
    }
    private static double Finite(double value)
    {
        if (!double.IsFinite(value)) throw new CalculationException("out_of_range");
        return value;
    }
    public static BandwidthResult Bandwidth(double min, double max)
    {
        Positive(min, "fmin_not_positive");
        if (!double.IsFinite(max) || max <= min) throw new CalculationException("fmax_not_greater_than_fmin");
        double center = min / 2 + max / 2, absolute = max - min, fraction = absolute / center;
        return new(absolute, center, fraction, Finite(fraction * 100));
    }
    public static ApertureResult Aperture(double frequency, double gainDbi, double area)
    {
        Positive(frequency, "frequency_not_positive");
        if (!double.IsFinite(gainDbi)) throw new CalculationException("gain_not_finite");
        Positive(area, "area_not_positive");
        double lambda = Finite(SpeedOfLight / frequency);
        double effective = Finite(lambda * lambda / (4 * Math.PI) * Math.Pow(10, gainDbi / 10));
        double efficiency = Finite(effective / area * 100);
        return new(lambda, effective, efficiency, efficiency > 100);
    }
    public static WavelengthResult Wavelength(double frequency, double er)
    {
        Positive(frequency, "frequency_not_positive"); Permittivity(er);
        double free = Finite(SpeedOfLight / frequency), guided = free / Math.Sqrt(er);
        return new(free, guided, guided / 2, guided / 4, SpeedOfLight / Math.Sqrt(er));
    }
    // Hammerstad–Jensen (1980), negligible conductor thickness.
    public static LineResult Microstrip(double width, double height, double er)
    {
        Positive(width, "width_not_positive"); Positive(height, "height_not_positive"); Permittivity(er);
        double u = width / height;
        double a = 1 + Math.Log((Math.Pow(u, 4) + Math.Pow(u / 52, 2)) / (Math.Pow(u, 4) + 0.432)) / 49
                     + Math.Log(1 + Math.Pow(u / 18.1, 3)) / 18.7;
        double b = 0.564 * Math.Pow((er - 0.9) / (er + 3), 0.053);
        double ee = (er + 1) / 2 + (er - 1) / 2 * Math.Pow(1 + 10 / u, -a * b);
        double f = 6 + (2 * Math.PI - 6) * Math.Exp(-Math.Pow(30.666 / u, 0.7528));
        double z = 376.730313668 / (2 * Math.PI) * Math.Log(f / u + Math.Sqrt(1 + Math.Pow(2 / u, 2))) / Math.Sqrt(ee);
        return Line(z, ee, u < 0.01 || u > 100 || er > 128);
    }
    public static LineResult Coaxial(double inner, double outer, double er)
    {
        Positive(inner, "inner_not_positive");
        if (!double.IsFinite(outer) || outer <= inner) throw new CalculationException("outer_not_greater_than_inner");
        Permittivity(er);
        return Line(60 / Math.Sqrt(er) * (Math.Log(outer) - Math.Log(inner)), er);
    }
    // Ghione–Naldi conformal mapping; grounded variant adds the tanh-mapped capacitance.
    public static LineResult Coplanar(double width, double gap, double height, double er, bool grounded = false)
    {
        Positive(width, "width_not_positive"); Positive(gap, "gap_not_positive");
        Positive(height, "height_not_positive"); Permittivity(er);
        double k = width / (width + 2 * gap), x = Math.PI * width / (4 * height), y = Math.PI * (width + 2 * gap) / (4 * height);
        double ratio = EllipticRatio(k), ee, z;
        if (!grounded)
        {
            double k1 = y > 350 ? Math.Exp(x - y) : Math.Sinh(x) / Math.Sinh(y);
            ee = 1 + (er - 1) / 2 * EllipticRatio(k1) / ratio;
            z = 30 * Math.PI / Math.Sqrt(ee) / ratio;
        }
        else
        {
            double k3 = Math.Tanh(x) / Math.Tanh(y), q = EllipticRatio(k3) / ratio;
            ee = (1 + er * q) / (1 + q);
            z = 60 * Math.PI / Math.Sqrt(ee) / (ratio + EllipticRatio(k3));
        }
        return Line(z, ee);
    }
    private static LineResult Line(double z, double ee, bool outside = false) =>
        new(Finite(z), Finite(ee), Finite(SpeedOfLight / Math.Sqrt(ee)), outside);

    // Deslandes & Wu (2001). Via recommendation uses dielectric wavelength, not the dispersive TE10 wavelength.
    public static SiwResult Siw(double frequency, double er, double width)
    {
        Positive(frequency, "frequency_not_positive"); Permittivity(er); Positive(width, "width_not_positive");
        double diameter = Finite(SpeedOfLight / frequency / Math.Sqrt(er) / 10), pitch = diameter * 1.5;
        double effective = width - diameter * diameter / (0.95 * pitch);
        if (!double.IsFinite(effective) || effective <= 0) throw new CalculationException("width_too_small_for_vias");
        double cutoff = Finite(SpeedOfLight / (2 * effective * Math.Sqrt(er)));
        return new(diameter, pitch, effective, cutoff, frequency <= cutoff);
    }
    public static double EllipticK(double k)
    {
        if (!double.IsFinite(k) || k < 0 || k >= 1) throw new CalculationException("out_of_range");
        double a = 1, b = Math.Sqrt((1 - k) * (1 + k));
        for (int i = 0; i < 100 && Math.Abs(a - b) > 1e-15; i++)
        {
            double next = (a + b) / 2; b = Math.Sqrt(a * b); a = next;
        }
        return Math.PI / (2 * a);
    }
    public static double EllipticRatio(double k) =>
        k == 0 ? 0 : k == 1 ? double.PositiveInfinity : EllipticK(k) / EllipticK(Math.Sqrt((1 - k) * (1 + k)));
}
