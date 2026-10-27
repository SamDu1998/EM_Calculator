using System.Globalization;
using EMCalculator.Core;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Automation;
using Microsoft.UI.Xaml.Controls;

namespace EMCalculator;

public sealed partial class MainPage : Page
{
    private bool chinese = Preferences.LoadChinese();
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
    private void Language_Click(object sender, RoutedEventArgs e)
    {
        chinese = !chinese;
        Preferences.SaveChinese(chinese);
        UpdateLanguage();
        RenderPage();
    }
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
            AutomationProperties.SetName(unit, T(label + "单位", label + " unit"));
            Grid.SetColumn(unit, 1);
            row.Children.Add(unit);
            unit.SelectionChanged += (_, _) => Calculate();
        }
        fields[key] = (input, unit);
        input.TextChanged += (_, _) => Calculate();
        inputs!.Children.Add(row);
    }
    private void SaveInputs()
    {
        if (displayedPage != null && fields.Count > 0)
            savedInputs[displayedPage] = fields.ToDictionary(pair => pair.Key, pair => (pair.Value.input.Text, pair.Value.unit?.SelectedIndex ?? 0));
    }
    private void RenderPage(bool preserve = true)
    {
        if (ContentPanel == null) return;
        building = true;
        if (preserve) SaveInputs();
        fields.Clear(); ContentPanel.Children.Clear(); lineType = null;
        displayedPage = page == "line" ? $"line:{savedLineType}" : page;
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
            string width = savedLineType switch { 0 => "3.06", 3 => "1", _ => "0.5" };
            string height = savedLineType switch { 0 => "1.6", 3 => "3.490343", _ => "0.635" };
            string er = savedLineType switch { 0 => "4.4", 3 => "2.25", _ => "9.8" };
            Field("width", T("线宽 W / 内导体直径 d", "Width W / inner diameter d"), width, length);
            Field("gap", T("间隙 S（CPW / GCPW）", "Gap S (CPW / GCPW)"), "0.25", length);
            Field("height", T("基板厚度 h / 外导体内径 D", "Substrate height h / outer diameter D"), height, length);
            Field("er", T("相对介电常数 εᵣ", "Relative permittivity εᵣ"), er);
            lineType.SelectionChanged += (_, _) =>
            {
                if (building || lineType == null) return;
                SaveInputs();
                savedLineType = lineType.SelectedIndex;
                RenderPage(false);
            };
        }
        ContentPanel.Children.Add(new TextBlock { Text = T("计算结果", "Results"), FontSize = 16, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold, Margin = new Thickness(0, 8, 0, 0) });
        results = new StackPanel { Spacing = 12 };
        ContentPanel.Children.Add(new Border { Style = (Style)Application.Current.Resources["CalculatorCard"], Child = results });
        if (savedInputs.TryGetValue(displayedPage, out var saved))
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
        return Units.Parse(input.Text, unit?.SelectedItem?.ToString());
    }
    private void Output(string label, double value, string unit)
    {
        if (!double.IsFinite(value)) throw new CalculationException("out_of_range");
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
    private void Warn(string message) => results!.Children.Add(new InfoBar { IsOpen = true, IsClosable = false, Severity = InfoBarSeverity.Warning, Message = message });
    private void FrequencyOutput(string label, double hz)
    {
        var (value, unit) = Units.Frequency(hz);
        Output(label, value, unit);
    }

    private string ErrorText(string code) => code switch
    {
        "frequency_not_positive" or "fmin_not_positive" => T("频率必须大于零。", "Frequency must be greater than zero."),
        "fmax_not_greater_than_fmin" => T("最高频率必须大于最低频率。", "Maximum frequency must exceed minimum frequency."),
        "area_not_positive" => T("物理口径面积必须大于零。", "Physical aperture area must be positive."),
        "gain_not_finite" => T("请输入有效的天线增益。", "Enter a finite antenna gain."),
        "er_less_than_one" => T("相对介电常数必须不小于 1。", "Relative permittivity must be at least 1."),
        "width_not_positive" => T("线宽或波导宽度必须大于零。", "Conductor or waveguide width must be positive."),
        "height_not_positive" => T("基板厚度必须大于零。", "Substrate height must be positive."),
        "gap_not_positive" => T("间隙必须大于零。", "Gap must be positive."),
        "inner_not_positive" => T("内导体直径必须大于零。", "Inner conductor diameter must be positive."),
        "outer_not_greater_than_inner" => T("外导体内径必须大于内导体直径。", "Outer conductor inner diameter must exceed inner conductor diameter."),
        "width_too_small_for_vias" => T("波导宽度对推荐通孔尺寸过小。", "Waveguide width is too small for the recommended vias."),
        "out_of_range" => T("输入超出计算范围。", "Inputs are outside the calculation range."),
        _ => T("请输入有效数字，可使用科学计数法。", "Enter valid numbers; scientific notation is supported.")
    };

    private void Calculate()
    {
        if (building || results == null) return;
        results.Children.Clear();
        outputCount = 0;
        try
        {
            switch (page)
            {
                case "bandwidth":
                    var bandwidth = Calculations.Bandwidth(Value("min"), Value("max"));
                    Output(T("相对带宽", "Relative bandwidth"), bandwidth.RelativePercent, "%");
                    FrequencyOutput(T("中心频率", "Center frequency"), bandwidth.CenterHz);
                    FrequencyOutput(T("绝对带宽", "Bandwidth"), bandwidth.AbsoluteHz);
                    break;
                case "aperture":
                    var aperture = Calculations.Aperture(Value("f"), Value("gain"), Value("area"));
                    Output(T("口径效率", "Aperture efficiency"), aperture.EfficiencyPercent, "%");
                    Output(T("波长", "Wavelength"), aperture.WavelengthM, "m");
                    Output(T("有效面积", "Effective area"), aperture.EffectiveAreaM2, "m²");
                    if (aperture.ExceedsPhysicalLimit) Warn(T("效率超过 100%，请检查增益和面积。", "Efficiency exceeds 100%; check gain and area."));
                    break;
                case "wavelength":
                    var wavelength = Calculations.Wavelength(Value("f"), Value("er"));
                    Output(T("自由空间波长 λ₀", "Free-space wavelength λ₀"), wavelength.Lambda0M, "m");
                    Output(T("介质波长 λg", "Dielectric wavelength λg"), wavelength.LambdaGM, "m");
                    Output("λg / 2", wavelength.HalfLambdaGM, "m");
                    Output("λg / 4", wavelength.QuarterLambdaGM, "m");
                    Output(T("相速度", "Phase velocity"), wavelength.PhaseVelocityMPerS, "m/s");
                    break;
                case "siw":
                    var siw = Calculations.Siw(Value("f"), Value("er"), Value("width"));
                    Output(T("通孔直径 d", "Via diameter d"), siw.ViaDiameterM * 1000, "mm");
                    Output(T("通孔间距 p", "Via pitch p"), siw.ViaPitchM * 1000, "mm");
                    Output(T("等效宽度", "Effective width"), siw.EffectiveWidthM * 1000, "mm");
                    FrequencyOutput(T("截止频率", "Cutoff frequency"), siw.CutoffFrequencyHz);
                    if (siw.BelowCutoff) Warn(T("工作频率不高于截止频率。", "Operating frequency is at or below cutoff."));
                    break;
                case "line":
                    CalculateLine();
                    break;
            }
        }
        catch (CalculationException ex)
        {
            results.Children.Clear();
            results.Children.Add(new InfoBar { IsOpen = true, IsClosable = false, Severity = InfoBarSeverity.Error, Message = ErrorText(ex.Code) });
        }
    }

    private void CalculateLine()
    {
        double width = Value("width"), height = Value("height"), er = Value("er");
        var type = (LineType)savedLineType;
        LineResult line = type switch
        {
            LineType.Microstrip => Calculations.Microstrip(width, height, er),
            LineType.Coaxial => Calculations.Coaxial(width, height, er),
            _ => Calculations.Coplanar(width, Value("gap"), height, er, type == LineType.Gcpw)
        };
        Output(T("特性阻抗 Z₀", "Characteristic impedance Z₀"), line.Z0Ohm, "Ω");
        Output(T("有效介电常数", "Effective permittivity"), line.EpsilonEff, "");
        Output(T("相速度", "Phase velocity"), line.PhaseVelocityMPerS, "m/s");
        if (line.OutsideValidatedRange) Warn(T("输入超出模型验证范围：0.01 ≤ W/h ≤ 100，εᵣ ≤ 128。", "Outside the validated range: 0.01 ≤ W/h ≤ 100, εᵣ ≤ 128."));
    }
}
