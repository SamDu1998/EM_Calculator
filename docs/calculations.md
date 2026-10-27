# Calculation models and regression checks

All public calculation functions live in `src/EMCalculator.Core/Calculations.cs` and take SI values. The UI converts units through `Units` and displays validated results. The core does not depend on WinUI or Windows APIs.

## Models

- **Bandwidth:** center = (fmin + fmax)/2; fractional bandwidth = (fmax − fmin)/center; percentage = fractional × 100. Center evaluation avoids intermediate addition overflow.
- **Aperture:** λ = c/f, Aₑ = λ²/(4π) × 10^(G/10), η = Aₑ/Aphys × 100%. Values above 100% produce a warning rather than being silently clamped.
- **Wavelength:** λ₀ = c/f and λg = λ₀/√εᵣ for a uniform, nonmagnetic dielectric and a TEM wave. This is not a general waveguide dispersion formula.
- **Microstrip:** Hammerstad–Jensen (1980), negligible conductor thickness. The UI warns outside 0.01 ≤ W/h ≤ 100 or εᵣ > 128. Loss and dispersion are not modeled.
- **CPW:** finite-substrate Ghione–Naldi conformal mapping, no bottom ground. Complete elliptic integrals use bounded arithmetic–geometric mean iteration.
- **GCPW:** conductor-backed coplanar conformal mapping (Ghione/Simons), adding the tanh-mapped ground contribution.
- **Coaxial:** Z₀ = 60/√εᵣ × ln(D/d), D > d; homogeneous dielectric, TEM mode.
- **SIW:** Deslandes & Wu (2001), d = λd/10, p = 1.5d, aeff = a − d²/(0.95p), fc = c/(2aeff√εᵣ). λd is the wavelength in the dielectric. A below-cutoff warning does not establish single-mode operation or manufacturability.

The speed of light is 299,792,458 m/s. Non-finite and invalid inputs are rejected; numerical overflow produces a range error.

## Verification

Run `dotnet run --project tests/EMCalculator.Tests -c Release`.

The 31 regression cases in `tests/EMCalculator.Tests/Fixtures/calculations.json` preserve the numerical expectations from the previous implementation across all eight model groups. Additional checks cover invalid inputs, unit conversion, elliptic-integral reference values, physical relationships, and analytic limits. Numeric fixture comparisons use a relative tolerance of 1e-10 (absolute floor 1e-12).

These regression cases establish continuity with the previous implementation; they do not constitute independent full-wave electromagnetic validation. The test runner returns a non-zero exit code on failure and is used by the Windows CI and release workflows.
