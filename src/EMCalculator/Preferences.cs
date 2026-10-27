using System.Globalization;
using System.Text.Json;

namespace EMCalculator;

internal static class Preferences
{
    private sealed record Settings(bool Chinese);
    private static readonly string DirectoryPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "EMCalculator");
    private static readonly string FilePath = Path.Combine(DirectoryPath, "settings.json");

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
