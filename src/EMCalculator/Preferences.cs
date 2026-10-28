using System.Globalization;
using System.Runtime.InteropServices;
using System.Text.Json;
using Windows.Storage;

namespace EMCalculator;

internal static class Preferences
{
    private sealed record Settings(bool Chinese);
    private static readonly string DirectoryPath = GetDirectoryPath();
    private static readonly string FilePath = Path.Combine(DirectoryPath, "settings.json");

    private static string GetDirectoryPath()
    {
        try
        {
            string packageDirectory = Path.Combine(ApplicationData.Current.LocalFolder.Path, "EMCalculator");
            MigrateLegacySettings(packageDirectory);
            return packageDirectory;
        }
        catch (Exception ex) when (ex is COMException or InvalidOperationException)
        {
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "EMCalculator");
        }
    }

    private static void MigrateLegacySettings(string packageDirectory)
    {
        try
        {
            string legacySettings = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "AppData", "Local", "EMCalculator", "settings.json");
            string packagedSettings = Path.Combine(packageDirectory, "settings.json");
            if (!File.Exists(packagedSettings) && File.Exists(legacySettings))
            {
                Directory.CreateDirectory(packageDirectory);
                File.Copy(legacySettings, packagedSettings);
            }
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException) { }
    }

    public static bool LoadChinese()
    {
        try
        {
            if (File.Exists(FilePath))
                return JsonSerializer.Deserialize<Settings>(File.ReadAllText(FilePath))?.Chinese
                    ?? CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "zh";
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or JsonException) { }
        return CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "zh";
    }

    public static void SaveChinese(bool chinese)
    {
        try
        {
            Directory.CreateDirectory(DirectoryPath);
            string temporary = FilePath + ".tmp";
            File.WriteAllText(temporary, JsonSerializer.Serialize(new Settings(chinese)));
            File.Move(temporary, FilePath, true);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException) { }
    }
}
