# WinUI 3 migration prototype

This is an unfinished Windows-native port alongside the existing Electron app.
It is not a release: the calculation port needs automated parity tests against
the existing fixtures, accessibility and language persistence need work, and
the distribution package has not been validated on a clean machine.

Requirements: Windows 10 1809 or newer, .NET 8 SDK and Windows App SDK build
dependencies. From the `winui` directory, restore and build on Windows:

```powershell
dotnet restore EMCalculator/EMCalculator.csproj -p:Platform=x64
dotnet build EMCalculator/EMCalculator.csproj -c Debug -p:Platform=x64 -p:SelfContained=false
dotnet publish EMCalculator/EMCalculator.csproj -c Release -p:Platform=x64 -p:PublishTrimmed=false -p:PublishReadyToRun=false -o publish
```

The publish command produces a self-contained folder. Measure the full folder
or its archive rather than the small launcher executable alone. No migration
to the GitHub release pipeline has been performed.
