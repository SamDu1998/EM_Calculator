using System.Globalization;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace EMCalculator;

public sealed partial class MainPage : Page
{
    private bool chinese = true;
    private string page = "bandwidth";
    private readonly Dictionary<string, (TextBox input, ComboBox? unit)> fields = new();
    private StackPanel? results;
    private StackPanel? inputs;
    private int outputCount;
    private ComboBox? lineType;
    private bool building;
    private string? displayedPage;
    private readonly Dictionary<string, Dictionary<string, (string text, int unit)>> savedInputs = new();
    private int savedLineType;
    private const double C = 299792458;

    public MainPage()
    {
        InitializeComponent();
        UpdateLanguage();
        Navigation.SelectedItem = BandwidthNav;
        RenderPage();
    }

    private string T(string zh, string en) => chinese ? zh : en;
    private void UpdateLanguage()
    {
        BandwidthNav.Content = T("相对带宽", "Bandwidth");
        ApertureNav.Content = T("口径效率", "Aperture efficiency");
        WavelengthNav.Content = T("波长", "Wavelength");
        LineNav.Content = T("传输线阻抗", "Transmission line");
        SiwNav.Content = T("SIW 通孔设计", "SIW via design");
        LanguageButton.Content = chinese ? "English" : "中文";
    }
    private void Language_Click(object sender, RoutedEventArgs e) { chinese = !chinese; UpdateLanguage(); RenderPage(); }
    private void Navigation_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.SelectedItem is NavigationViewItem item && item.Tag is string tag) { page = tag; RenderPage(); }
    }

    private void Field(string key, string label, string initial, string[]? units = null, int selected = 0)
    {
        var row = new Grid { ColumnSpacing = 8 };
        row.ColumnDefinitions.Add(new ColumnDefinition());
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        var input = new TextBox { Header = label, Text = initial, HorizontalAlignment = HorizontalAlignment.Stretch };
        row.Children.Add(input);
        ComboBox? unit = null;
        if (units != null)
        {
            unit = new ComboBox { VerticalAlignment = VerticalAlignment.Bottom, MinWidth = 90 };
            foreach (var item in units) unit.Items.Add(item);
            unit.SelectedIndex = selected;
            Grid.SetColumn(unit, 1);
            row.Children.Add(unit);
            unit.SelectionChanged += (_, _) => Calculate();
        }
        fields[key] = (input, unit);
        input.TextChanged += (_, _) => Calculate();
        inputs!.Children.Add(row);
    }
    private void RenderPage()
    {
        if (ContentPanel == null) return;
        building = true;
        if (displayedPage != null && fields.Count > 0)
        {
            savedInputs[displayedPage] = fields.ToDictionary(pair => pair.Key, pair => (pair.Value.input.Text, pair.Value.unit?.SelectedIndex ?? 0));
            if (displayedPage == "line" && lineType != null) savedLineType = lineType.SelectedIndex;
        }
        fields.Clear(); ContentPanel.Children.Clear(); lineType = null;
        displayedPage = page;
        string title = page switch {
            "aperture" => T("口径效率", "Aperture efficiency"),
            "wavelength" => T("波长", "Wavelength"),
            "line" => T("传输线阻抗", "Transmission line"),
            "siw" => T("SIW 通孔设计", "SIW via design"),
            _ => T("相对带宽", "Relative bandwidth")
        };
        ContentPanel.Children.Add(new TextBlock { Text = title, FontSize = 32, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold });
        ContentPanel.Children.Add(new TextBlock { Text = T("输入参数，结果将实时更新。", "Results update as you enter parameters."), Opacity = 0.65, Margin = new Thickness(0, -6, 0, 8) });
        ContentPanel.Children.Add(new TextBlock { Text = T("输入参数", "Parameters"), FontSize = 16, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold });
        inputs = new StackPanel { Spacing = 14 };
        ContentPanel.Children.Add(new Border { Style = (Style)Application.Current.Resources["CalculatorCard"], Child = inputs });
        string[] freq = ["Hz", "kHz", "MHz", "GHz"];
        string[] length = ["mm", "µm", "mil"];
        if (page == "bandwidth")
        {
            Field("min", T("最低频率", "Minimum frequency"), "2.4", freq, 3);
            Field("max", T("最高频率", "Maximum frequency"), "2.4835", freq, 3);
        }
        else if (page == "aperture")
        {
            Field("f", T("频率", "Frequency"), "10", freq, 3);
            Field("gain", T("天线增益 (dBi)", "Antenna gain (dBi)"), "30");
            Field("area", T("物理口径面积", "Physical aperture area"), "1", ["m²", "cm²"]);
        }
        else if (page == "wavelength")
        {
            Field("f", T("频率", "Frequency"), "2.4", freq, 3);
            Field("er", T("相对介电常数 εᵣ", "Relative permittivity εᵣ"), "1");
        }
        else if (page == "siw")
        {
            Field("f", T("工作频率", "Operating frequency"), "10", freq, 3);
            Field("er", T("相对介电常数 εᵣ", "Relative permittivity εᵣ"), "3.38");
            Field("width", T("通孔中心间宽度 a", "Via center-to-center width a"), "13", length);
        }
        else
        {
            lineType = new ComboBox { Header = T("传输线类型", "Line type"), HorizontalAlignment = HorizontalAlignment.Stretch };
            foreach (var name in new[] { "Microstrip", "CPW", "GCPW", "Coaxial" }) lineType.Items.Add(name);
            lineType.SelectedIndex = savedLineType;
            inputs.Children.Add(lineType);
            Field("width", T("线宽 W / 内导体直径 d", "Width W / inner diameter d"), "3.06", length);
            Field("gap", T("间隙 S（CPW / GCPW）", "Gap S (CPW / GCPW)"), "0.25", length);
            Field("height", T("基板厚度 h / 外导体内径 D", "Substrate height h / outer diameter D"), "1.6", length);
            Field("er", T("相对介电常数 εᵣ", "Relative permittivity εᵣ"), "4.4");
            lineType.SelectionChanged += (_, _) => { UpdateLineFields(); Calculate(); };
        }
        ContentPanel.Children.Add(new TextBlock { Text = T("计算结果", "Results"), FontSize = 16, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold, Margin = new Thickness(0, 8, 0, 0) });
        results = new StackPanel { Spacing = 12 };
        ContentPanel.Children.Add(new Border { Style = (Style)Application.Current.Resources["CalculatorCard"], Child = results });
        if (savedInputs.TryGetValue(page, out var saved))
            foreach (var (key, value) in saved)
                if (fields.TryGetValue(key, out var field))
                {
                    field.input.Text = value.text;
                    if (field.unit != null) field.unit.SelectedIndex = value.unit;
                }
        if (page == "line") UpdateLineFields();
        building = false; Calculate();
    }
    private void UpdateLineFields()
    {
        if (lineType == null || !fields.ContainsKey("gap")) return;
        int type = lineType.SelectedIndex;
        fields["width"].input.Header = type == 3 ? T("内导体直径 d", "Inner conductor diameter d") : T("线宽 W", "Conductor width W");
        fields["height"].input.Header = type == 3 ? T("外导体内径 D", "Outer conductor inner diameter D") : T("基板厚度 h", "Substrate height h");
        ((Grid)fields["gap"].input.Parent).Visibility = type == 1 || type == 2 ? Visibility.Visible : Visibility.Collapsed;
    }
    private double Value(string key)
    {
        var (input, unit) = fields[key];
        if (!double.TryParse(input.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out var value) || !double.IsFinite(value)) throw new ArgumentException(T("请输入有效数字。", "Enter valid numbers."));
        return value * (unit?.SelectedItem?.ToString() switch {
            "kHz" => 1e3, "MHz" => 1e6, "GHz" => 1e9, "mm" => 1e-3,
            "µm" => 1e-6, "mil" => 25.4e-6, "cm²" => 1e-4, _ => 1
        });
    }
    private void Output(string label, double value, string unit)
    {
        if (!double.IsFinite(value)) throw new ArgumentException(T("输入超出计算范围。", "Inputs are outside the calculation range."));
        string number = value.ToString("G7", CultureInfo.InvariantCulture);
        if (outputCount++ == 0)
        {
            var primary = new StackPanel { Spacing = 4, Margin = new Thickness(0, 0, 0, 8) };
            primary.Children.Add(new TextBlock { Text = label, Opacity = 0.72, TextWrapping = TextWrapping.Wrap });
            primary.Children.Add(new TextBlock { Text = $"{number} {unit}", FontSize = 32, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold, TextWrapping = TextWrapping.Wrap });
            results!.Children.Add(primary);
        }
        else
        {
            var row = new Grid { ColumnSpacing = 20 };
            row.ColumnDefinitions.Add(new ColumnDefinition());
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            row.Children.Add(new TextBlock { Text = label, Opacity = 0.72, TextWrapping = TextWrapping.Wrap, VerticalAlignment = VerticalAlignment.Center });
            var resultValue = new TextBlock { Text = $"{number} {unit}", FontWeight = Microsoft.UI.Text.FontWeights.SemiBold, VerticalAlignment = VerticalAlignment.Center };
            Grid.SetColumn(resultValue, 1); row.Children.Add(resultValue);
            results!.Children.Add(row);
        }
    }
    private void Warn(string message) => results!.Children.Add(new InfoBar { IsOpen = true, Severity = InfoBarSeverity.Warning, Message = message });
    private static double K(double k)
    {
        if (k < 0 || k >= 1 || !double.IsFinite(k)) return double.NaN;
        double a = 1, b = Math.Sqrt(1-k*k);
        for (int i = 0; i < 100 && Math.Abs(a-b) > 1e-15; i++) { double n = (a+b)/2; b = Math.Sqrt(a*b); a = n; }
        return Math.PI/(2*a);
    }
    private static double Ratio(double k) => k == 0 ? 0 : k == 1 ? double.PositiveInfinity : K(k)/K(Math.Sqrt(1-k*k));
    private void Calculate()
    {
        if (building || results == null) return;
        results.Children.Clear();
        outputCount = 0;
        try
        {
            if (page == "bandwidth")
            {
                double min = Value("min"), max = Value("max");
                if (min <= 0 || max <= min) throw new ArgumentException(T("频率必须大于零，且最高频率须大于最低频率。", "Frequencies must be positive and maximum must exceed minimum."));
                double center = (min+max)/2, bw = max-min;
                Output(T("相对带宽", "Relative bandwidth"), bw/center*100, "%"); Output(T("中心频率", "Center frequency"), center/1e9, "GHz"); Output(T("绝对带宽", "Bandwidth"), bw/1e6, "MHz");
            }
            else if (page == "aperture")
            {
                double f = Value("f"), gain = Value("gain"), area = Value("area");
                if (f <= 0 || area <= 0) throw new ArgumentException(T("频率和面积必须大于零。", "Frequency and area must be positive."));
                double lambda = C/f, ae = lambda*lambda/(4*Math.PI)*Math.Pow(10, gain/10), eta = ae/area*100;
                Output(T("口径效率", "Aperture efficiency"), eta, "%"); Output(T("波长", "Wavelength"), lambda, "m"); Output(T("有效面积", "Effective area"), ae, "m²");
                if (eta > 100) Warn(T("效率超过 100%，请检查增益和面积。", "Efficiency exceeds 100%; check gain and area."));
            }
            else if (page == "wavelength")
            {
                double f = Value("f"), er = Value("er");
                if (f <= 0 || er < 1) throw new ArgumentException(T("频率须大于零，介电常数须不小于 1。", "Frequency must be positive and permittivity at least 1."));
                double l0 = C/f, lg = l0/Math.Sqrt(er);
                Output(T("自由空间波长 λ₀", "Free-space wavelength λ₀"), l0, "m"); Output(T("介质波长 λg", "Dielectric wavelength λg"), lg, "m");
                Output("λg / 2", lg/2, "m"); Output("λg / 4", lg/4, "m"); Output(T("相速度", "Phase velocity"), C/Math.Sqrt(er), "m/s");
            }
            else if (page == "siw")
            {
                double f = Value("f"), er = Value("er"), width = Value("width");
                if (f <= 0 || er < 1 || width <= 0) throw new ArgumentException(T("请检查频率、介电常数和宽度。", "Check frequency, permittivity and width."));
                double d = C/(f*Math.Sqrt(er))/10, pitch = 1.5*d, effective = width-d*d/(0.95*pitch);
                if (effective <= 0) throw new ArgumentException(T("波导宽度对推荐通孔尺寸过小。", "Width is too small for the recommended vias."));
                double fc = C/(2*effective*Math.Sqrt(er));
                Output(T("通孔直径 d", "Via diameter d"), d*1000, "mm"); Output(T("通孔间距 p", "Via pitch p"), pitch*1000, "mm"); Output(T("等效宽度", "Effective width"), effective*1000, "mm"); Output(T("截止频率", "Cutoff frequency"), fc/1e9, "GHz");
                if (f <= fc) Warn(T("工作频率不高于截止频率。", "Operating frequency is at or below cutoff."));
            }
            else CalculateLine();
        }
        catch (ArgumentException ex) { results.Children.Clear(); Warn(ex.Message); }
    }
    private void CalculateLine()
    {
        double w = Value("width"), h = Value("height"), er = Value("er");
        if (w <= 0 || h <= 0 || er < 1) throw new ArgumentException(T("尺寸须大于零，介电常数须不小于 1。", "Dimensions must be positive and permittivity at least 1."));
        int type = lineType!.SelectedIndex; double ee, z;
        if (type == 0)
        {
            double u = w/h, a = 1 + Math.Log((Math.Pow(u,4)+Math.Pow(u/52,2))/(Math.Pow(u,4)+0.432))/49 + Math.Log(1+Math.Pow(u/18.1,3))/18.7;
            double b = 0.564*Math.Pow((er-0.9)/(er+3),0.053);
            ee = (er+1)/2+(er-1)/2*Math.Pow(1+10/u,-a*b);
            double ff = 6+(2*Math.PI-6)*Math.Exp(-Math.Pow(30.666/u,0.7528));
            z = 376.730313668/(2*Math.PI)*Math.Log(ff/u+Math.Sqrt(1+Math.Pow(2/u,2)))/Math.Sqrt(ee);
            if (u < 0.01 || u > 100 || er > 128) Warn(T("输入超出模型验证范围。", "Inputs are outside the validated model range."));
        }
        else if (type == 3)
        {
            if (h <= w) throw new ArgumentException(T("外导体内径须大于内导体直径。", "Outer diameter must exceed inner diameter."));
            ee = er; z = 60/Math.Sqrt(er)*Math.Log(h/w);
        }
        else
        {
            double gap = Value("gap"); if (gap <= 0) throw new ArgumentException(T("间隙须大于零。", "Gap must be positive."));
            double k = w/(w+2*gap), x = Math.PI*w/(4*h), y = Math.PI*(w+2*gap)/(4*h);
            if (type == 1)
            {
                double k1 = y > 350 ? Math.Exp(x-y) : Math.Sinh(x)/Math.Sinh(y);
                ee = 1+(er-1)/2*Ratio(k1)/Ratio(k); z = 30*Math.PI/Math.Sqrt(ee)/Ratio(k);
            }
            else
            {
                double k3 = Math.Tanh(x)/Math.Tanh(y), q = Ratio(k3)/Ratio(k);
                ee = (1+er*q)/(1+q); z = 60*Math.PI/Math.Sqrt(ee)/(Ratio(k)+Ratio(k3));
            }
        }
        Output(T("特性阻抗 Z₀", "Characteristic impedance Z₀"), z, "Ω");
        Output(T("有效介电常数", "Effective permittivity"), ee, "");
        Output(T("相速度", "Phase velocity"), C/Math.Sqrt(ee), "m/s");
    }
}
