using Microsoft.UI.Xaml;
namespace EMCalculator;
public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        AppWindow.SetIcon(System.IO.Path.Combine(AppContext.BaseDirectory, "Assets", "AppIcon.ico"));
        RootFrame.Loaded += RootFrame_Loaded;
        RootFrame.Navigate(typeof(MainPage));
    }

    private void RootFrame_Loaded(object sender, RoutedEventArgs e)
    {
        RootFrame.Loaded -= RootFrame_Loaded;
        double scale = RootFrame.XamlRoot?.RasterizationScale ?? 1;
        AppWindow.Resize(new Windows.Graphics.SizeInt32(
            (int)Math.Round(1100 * scale),
            (int)Math.Round(850 * scale)));
    }
}
