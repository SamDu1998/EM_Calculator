using System.Globalization;
using EMCalculator.Core;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Automation;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Shapes;
using Windows.UI;

namespace EMCalculator;

public sealed partial class MainPage : Page
{
    private const double MaximumContentWidth = 1320;
    private const double TwoColumnBreakpoint = 880;

    private bool chinese = Preferences.LoadChinese();
    private string page = "bandwidth";
    private readonly Dictionary<string, (TextBox input, ComboBox? unit)> fields = new();
    private StackPanel? results;
    private StackPanel? inputs;
    private Grid? pageLayout;
    private Border? inputCard;
    private Border? resultCard;
    private Border? diagramCard;
    private Canvas? diagramCanvas;
    private TextBlock? diagramDescription;
    private TextBlock? pageTitle;
    private TextBlock? primaryResultValue;
    private readonly List<TextBlock> sectionHeadings = [];
    private int outputCount;
    private ComboBox? lineType;
    private bool building;
    private bool? isWideLayout;
    private string? displayedPage;
    private readonly Dictionary<string, Dictionary<string, (string text, int unit)>> savedInputs = new();
    private int savedLineType;
    private SiwResult? lastSiw;

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
        if (args.SelectedItem is NavigationViewItem item && item.Tag is string tag)
        {
            page = tag;
            RenderPage();
        }
    }

    private void ContentViewport_SizeChanged(object sender, SizeChangedEventArgs e)
    {
        double sideMargin = e.NewSize.Width < 600 ? 16 : 32;
        ContentPanel.Margin = new Thickness(sideMargin, 28, sideMargin, 48);
        ContentPanel.Width = Math.Max(0, Math.Min(MaximumContentWidth, e.NewSize.Width - 2 * sideMargin));
        UpdateResponsiveLayout(ContentPanel.Width);
    }

    private void Field(string key, string label, string initial, string[]? units = null, int selected = 0)
    {
        var row = new Grid { ColumnSpacing = 8 };
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var input = new TextBox
        {
            Header = label,
            Text = initial,
            HorizontalAlignment = HorizontalAlignment.Stretch,
            IsTextScaleFactorEnabled = true
        };
        row.Children.Add(input);

        ComboBox? unit = null;
        if (units != null)
        {
            unit = new ComboBox
            {
                VerticalAlignment = VerticalAlignment.Bottom,
                MinWidth = 88,
                IsTextScaleFactorEnabled = true
            };
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

    private TextBlock SectionHeading(string text)
    {
        var heading = new TextBlock
        {
            Text = text,
            FontSize = 16,
            FontWeight = Microsoft.UI.Text.FontWeights.SemiBold,
            IsTextScaleFactorEnabled = true
        };
        sectionHeadings.Add(heading);
        return heading;
    }

    private Border SectionCard(string title, UIElement content)
    {
        var stack = new StackPanel { Spacing = 14 };
        stack.Children.Add(SectionHeading(title));
        stack.Children.Add(content);
        return new Border
        {
            Style = (Style)Application.Current.Resources["CalculatorCard"],
            Child = stack,
            VerticalAlignment = VerticalAlignment.Top
        };
    }

    private void RenderPage(bool preserve = true)
    {
        if (ContentPanel == null) return;

        building = true;
        if (preserve) SaveInputs();
        fields.Clear();
        ContentPanel.Children.Clear();
        sectionHeadings.Clear();
        lineType = null;
        pageLayout = null;
        inputCard = null;
        resultCard = null;
        diagramCard = null;
        diagramCanvas = null;
        diagramDescription = null;
        primaryResultValue = null;
        lastSiw = null;
        isWideLayout = null;

        displayedPage = page == "line" ? $"line:{savedLineType}" : page;
        string title = page switch
        {
            "aperture" => T("口径效率", "Aperture efficiency"),
            "wavelength" => T("波长", "Wavelength"),
            "line" => T("传输线阻抗", "Transmission line"),
            "siw" => T("SIW 通孔设计", "SIW via design"),
            _ => T("相对带宽", "Relative bandwidth")
        };

        pageTitle = new TextBlock
        {
            Text = title,
            FontSize = 32,
            FontWeight = Microsoft.UI.Text.FontWeights.SemiBold,
            TextWrapping = TextWrapping.Wrap,
            IsTextScaleFactorEnabled = true
        };
        ContentPanel.Children.Add(pageTitle);
        ContentPanel.Children.Add(new TextBlock
        {
            Text = T("输入参数，结果将实时更新。", "Results update as you enter parameters."),
            Opacity = 0.72,
            Margin = new Thickness(0, -8, 0, 4),
            TextWrapping = TextWrapping.Wrap,
            IsTextScaleFactorEnabled = true
        });

        inputs = new StackPanel { Spacing = 14 };
        results = new StackPanel { Spacing = 12 };
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
            lineType = new ComboBox
            {
                Header = T("传输线类型", "Line type"),
                HorizontalAlignment = HorizontalAlignment.Stretch,
                IsTextScaleFactorEnabled = true
            };
            foreach (var name in new[] { "Microstrip", "CPW", "GCPW", "Coaxial" }) lineType.Items.Add(name);
            lineType.SelectedIndex = savedLineType;
            inputs.Children.Add(lineType);

            string width = savedLineType switch { 0 => "3.06", 3 => "1", _ => "0.5" };
            string height = savedLineType switch { 0 => "1.6", 3 => "3.490343", _ => "0.635" };
            string er = savedLineType switch { 0 => "4.4", 3 => "2.25", _ => "9.8" };
            Field("width", T("线宽 W / 内导体直径 d", "Width W / inner diameter d"), width, length);
            Field("gap", T("间隙 S（CPW / GCPW）", "Gap S (CPW / GCPW)"), "0.25", length);
            Field("height", T("基板厚度 h / 外导体内径 D", "Substrate height h / outer conductor inner diameter D"), height, length);
            Field("er", T("相对介电常数 εᵣ", "Relative permittivity εᵣ"), er);

            lineType.SelectionChanged += (_, _) =>
            {
                if (building || lineType == null) return;
                SaveInputs();
                savedLineType = lineType.SelectedIndex;
                RenderPage(false);
            };
        }

        inputCard = SectionCard(T("输入参数", "Parameters"), inputs);
        resultCard = SectionCard(T("计算结果", "Results"), results);
        pageLayout = new Grid { ColumnSpacing = 18, RowSpacing = 16, HorizontalAlignment = HorizontalAlignment.Stretch };
        pageLayout.Children.Add(inputCard);
        pageLayout.Children.Add(resultCard);

        if (page is "line" or "siw")
        {
            diagramCanvas = new Canvas
            {
                Height = 250,
                HorizontalAlignment = HorizontalAlignment.Stretch,
                IsHitTestVisible = false
            };
            AutomationProperties.SetName(diagramCanvas, T("电磁结构示意图", "Electromagnetic structure schematic"));
            diagramCanvas.SizeChanged += (_, e) => DrawStructureDiagram(e.NewSize.Width, e.NewSize.Height);
            diagramDescription = new TextBlock
            {
                TextWrapping = TextWrapping.Wrap,
                Opacity = 0.78,
                IsTextScaleFactorEnabled = true
            };
            var diagramContents = new StackPanel { Spacing = 10 };
            diagramContents.Children.Add(diagramCanvas);
            diagramContents.Children.Add(diagramDescription);
            diagramCard = SectionCard(T("结构示意", "Structure"), diagramContents);
            pageLayout.Children.Add(diagramCard);
        }

        ContentPanel.Children.Add(pageLayout);
        pageLayout.SizeChanged += (_, e) => UpdateResponsiveLayout(e.NewSize.Width);

        if (savedInputs.TryGetValue(displayedPage, out var saved))
            foreach (var (key, value) in saved)
                if (fields.TryGetValue(key, out var field))
                {
                    field.input.Text = value.text;
                    if (field.unit != null) field.unit.SelectedIndex = value.unit;
                }

        if (page == "line") UpdateLineFields();
        building = false;
        UpdateResponsiveLayout(ContentPanel.ActualWidth > 0 ? ContentPanel.ActualWidth : ContentPanel.Width);
        Calculate();
    }

    private void UpdateResponsiveLayout(double width)
    {
        if (pageLayout == null || inputCard == null || resultCard == null) return;

        bool wide = width >= TwoColumnBreakpoint;
        if (isWideLayout != wide)
        {
            isWideLayout = wide;
            pageLayout.ColumnDefinitions.Clear();
            pageLayout.RowDefinitions.Clear();
            pageLayout.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            if (wide)
                pageLayout.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            int rowCount = wide ? (diagramCard == null ? 1 : 2) : (diagramCard == null ? 2 : 3);
            for (int i = 0; i < rowCount; i++)
                pageLayout.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            Grid.SetRow(inputCard, 0);
            Grid.SetColumn(inputCard, 0);
            Grid.SetRow(resultCard, wide ? 0 : 1);
            Grid.SetColumn(resultCard, wide ? 1 : 0);
            if (diagramCard != null)
            {
                Grid.SetRow(diagramCard, wide ? 1 : 2);
                Grid.SetColumn(diagramCard, 0);
                Grid.SetColumnSpan(diagramCard, wide ? 2 : 1);
            }
        }

        double titleSize = width < 480 ? 25 : width < TwoColumnBreakpoint ? 29 : 34;
        if (pageTitle != null) pageTitle.FontSize = titleSize;
        if (primaryResultValue != null)
            primaryResultValue.FontSize = width < 420 ? 24 : width < 720 ? 28 : 32;
        foreach (var heading in sectionHeadings)
            heading.FontSize = width < 420 ? 14 : 16;
    }

    private void UpdateLineFields()
    {
        if (lineType == null || !fields.ContainsKey("gap")) return;
        int type = lineType.SelectedIndex;
        fields["width"].input.Header = type == 3
            ? T("内导体直径 d", "Inner conductor diameter d")
            : T("线宽 W", "Conductor width W");
        fields["height"].input.Header = type == 3
            ? T("外导体内径 D", "Outer conductor inner diameter D")
            : T("基板厚度 h", "Substrate height h");
        ((Grid)fields["gap"].input.Parent).Visibility = type is 1 or 2 ? Visibility.Visible : Visibility.Collapsed;
    }

    private double Value(string key)
    {
        var (input, unit) = fields[key];
        return Units.Parse(input.Text, unit?.SelectedItem?.ToString());
    }

    private string FieldText(string key)
    {
        var (input, unit) = fields[key];
        string? selectedUnit = unit?.SelectedItem?.ToString();
        return string.IsNullOrEmpty(selectedUnit) ? input.Text : $"{input.Text} {selectedUnit}";
    }

    private void Output(string label, double value, string unit)
    {
        if (!double.IsFinite(value)) throw new CalculationException("out_of_range");
        string number = value.ToString("G7", CultureInfo.InvariantCulture);
        if (outputCount++ == 0)
        {
            var primary = new StackPanel { Spacing = 4, Margin = new Thickness(0, 0, 0, 8) };
            primary.Children.Add(new TextBlock
            {
                Text = label,
                Opacity = 0.72,
                TextWrapping = TextWrapping.Wrap,
                IsTextScaleFactorEnabled = true
            });
            primaryResultValue = new TextBlock
            {
                Text = $"{number} {unit}",
                FontSize = 32,
                FontWeight = Microsoft.UI.Text.FontWeights.SemiBold,
                TextWrapping = TextWrapping.Wrap,
                IsTextScaleFactorEnabled = true
            };
            primary.Children.Add(primaryResultValue);
            results!.Children.Add(primary);
            UpdateResponsiveLayout(ContentPanel.ActualWidth > 0 ? ContentPanel.ActualWidth : ContentPanel.Width);
        }
        else
        {
            var row = new Grid { ColumnSpacing = 16 };
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            row.Children.Add(new TextBlock
            {
                Text = label,
                Opacity = 0.72,
                TextWrapping = TextWrapping.Wrap,
                VerticalAlignment = VerticalAlignment.Center,
                IsTextScaleFactorEnabled = true
            });
            var resultValue = new TextBlock
            {
                Text = $"{number} {unit}",
                FontWeight = Microsoft.UI.Text.FontWeights.SemiBold,
                TextWrapping = TextWrapping.Wrap,
                TextAlignment = TextAlignment.Right,
                VerticalAlignment = VerticalAlignment.Center,
                IsTextScaleFactorEnabled = true
            };
            Grid.SetColumn(resultValue, 1);
            row.Children.Add(resultValue);
            results!.Children.Add(row);
        }
    }

    private void Warn(string message) => results!.Children.Add(new InfoBar
    {
        IsOpen = true,
        IsClosable = false,
        Severity = InfoBarSeverity.Warning,
        Message = message,
        IsTextScaleFactorEnabled = true
    });

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
        "outer_not_greater_than_inner" => T("外导体内径必须大于内导体直径。", "Outer conductor inner diameter must exceed the inner conductor diameter."),
        "width_too_small_for_vias" => T("波导宽度对推荐通孔尺寸过小。", "Waveguide width is too small for the recommended vias."),
        "out_of_range" => T("输入超出计算范围。", "Inputs are outside the calculation range."),
        _ => T("请输入有效数字，可使用科学计数法。", "Enter valid numbers; scientific notation is supported.")
    };

    private void Calculate()
    {
        if (building || results == null) return;
        results.Children.Clear();
        outputCount = 0;
        lastSiw = null;

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
                    lastSiw = Calculations.Siw(Value("f"), Value("er"), Value("width"));
                    Output(T("通孔直径 d", "Via diameter d"), lastSiw.ViaDiameterM * 1000, "mm");
                    Output(T("通孔间距 p", "Via pitch p"), lastSiw.ViaPitchM * 1000, "mm");
                    Output(T("等效宽度", "Effective width"), lastSiw.EffectiveWidthM * 1000, "mm");
                    FrequencyOutput(T("截止频率", "Cutoff frequency"), lastSiw.CutoffFrequencyHz);
                    if (lastSiw.BelowCutoff) Warn(T("工作频率不高于截止频率。", "Operating frequency is at or below cutoff."));
                    break;
                case "line":
                    CalculateLine();
                    break;
            }
            UpdateStructureDetails();
        }
        catch (CalculationException ex)
        {
            results.Children.Clear();
            primaryResultValue = null;
            results.Children.Add(new InfoBar
            {
                IsOpen = true,
                IsClosable = false,
                Severity = InfoBarSeverity.Error,
                Message = ErrorText(ex.Code),
                IsTextScaleFactorEnabled = true
            });
            UpdateStructureDetails();
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

    private void UpdateStructureDetails()
    {
        if (diagramDescription == null || diagramCanvas == null) return;

        if (page == "line")
        {
            int type = savedLineType;
            string name = type switch
            {
                0 => "Microstrip",
                1 => "CPW",
                2 => "GCPW",
                _ => "Coaxial"
            };
            string parameters = type switch
            {
                0 => $"W = {FieldText("width")}; h = {FieldText("height")}; εᵣ = {FieldText("er")}",
                1 or 2 => $"W = {FieldText("width")}; S = {FieldText("gap")}; h = {FieldText("height")}; εᵣ = {FieldText("er")}",
                _ => $"d = {FieldText("width")}; D = {FieldText("height")}; εᵣ = {FieldText("er") }"
            };
            diagramDescription.Text = $"{name} · {T("结构示意，非比例绘制。", "schematic, not to scale.")} {parameters}";
            AutomationProperties.SetName(diagramCanvas, $"{name} {T("传输线横截面示意图", "transmission-line cross-section schematic")}. {parameters}");
        }
        else if (page == "siw")
        {
            string parameters = $"a = {FieldText("width")}; εᵣ = {FieldText("er")}; f = {FieldText("f")}";
            if (lastSiw != null)
                parameters += $"; d = {Millimeters(lastSiw.ViaDiameterM)} mm; p = {Millimeters(lastSiw.ViaPitchM)} mm";
            diagramDescription.Text = $"{T("SIW 通孔阵列俯视图；示意图非比例绘制。", "SIW via-fence top view; schematic not to scale.")} {parameters}";
            AutomationProperties.SetName(diagramCanvas, $"{T("SIW 通孔阵列俯视结构示意图", "SIW via-fence top-view schematic")}. {parameters}");
        }
    }

    private static string Millimeters(double meters) => (meters * 1000).ToString("G5", CultureInfo.InvariantCulture);

    private Brush ThemeBrush(string key, Color fallback)
    {
        if (Application.Current.Resources.ContainsKey(key) && Application.Current.Resources[key] is Brush brush)
            return brush;
        return new SolidColorBrush(fallback);
    }

    private void DrawStructureDiagram(double width, double height)
    {
        if (diagramCanvas == null || width < 180 || height < 100) return;
        diagramCanvas.Children.Clear();

        Brush metal = ThemeBrush("AccentFillColorDefaultBrush", Color.FromArgb(255, 0, 120, 212));
        Brush dielectric = ThemeBrush("LayerFillColorDefaultBrush", Color.FromArgb(255, 224, 234, 244));
        Brush outline = ThemeBrush("ControlStrokeColorDefaultBrush", Color.FromArgb(255, 115, 125, 135));
        Brush primary = ThemeBrush("TextFillColorPrimaryBrush", Color.FromArgb(255, 30, 30, 30));
        Brush secondary = ThemeBrush("TextFillColorSecondaryBrush", Color.FromArgb(255, 100, 100, 100));

        if (page == "siw")
            DrawSiwDiagram(width, height, metal, dielectric, outline, primary, secondary);
        else
            DrawTransmissionLineDiagram(width, height, metal, dielectric, outline, primary, secondary);
    }

    private void DrawTransmissionLineDiagram(double width, double height, Brush metal, Brush dielectric, Brush outline, Brush primary, Brush secondary)
    {
        if (savedLineType == (int)LineType.Coaxial)
        {
            double centerX = width * 0.34;
            double centerY = height * 0.5;
            double outerRadius = Math.Min(78, height * 0.31);
            double dielectricRadius = outerRadius * 0.72;
            double innerRadius = outerRadius * 0.28;
            AddEllipse(centerX - outerRadius, centerY - outerRadius, outerRadius * 2, outerRadius * 2, metal, outline);
            AddEllipse(centerX - dielectricRadius, centerY - dielectricRadius, dielectricRadius * 2, dielectricRadius * 2, dielectric, outline);
            AddEllipse(centerX - innerRadius, centerY - innerRadius, innerRadius * 2, innerRadius * 2, metal, outline);
            AddDimensionVertical(centerX + outerRadius + 20, centerY - outerRadius, centerY + outerRadius, "D", secondary);
            AddDimensionVertical(centerX + innerRadius + 8, centerY - innerRadius, centerY + innerRadius, "d", secondary);
            AddLabel("εᵣ", width * 0.68, centerY - 15, width * 0.22, 16, primary);
            AddLabel(T("外导体", "Outer conductor"), width * 0.64, centerY + 10, width * 0.3, 13, secondary);
            return;
        }

        double left = width * 0.14;
        double right = width * 0.86;
        double center = width * 0.5;
        double substrateTop = height * 0.48;
        double substrateBottom = height * 0.76;
        double metalHeight = 13;
        double signalHalfWidth = savedLineType == (int)LineType.Microstrip ? Math.Clamp(width * 0.09, 36, 62) : Math.Clamp(width * 0.075, 30, 52);
        double gap = Math.Clamp(width * 0.035, 16, 27);

        AddRectangle(left, substrateTop, right - left, substrateBottom - substrateTop, dielectric, outline);
        if (savedLineType == (int)LineType.Microstrip)
        {
            AddRectangle(center - signalHalfWidth, substrateTop - metalHeight, signalHalfWidth * 2, metalHeight, metal, outline);
            AddRectangle(left, substrateBottom, right - left, metalHeight, metal, outline);
            AddDimensionHorizontal(center - signalHalfWidth, center + signalHalfWidth, substrateTop - 28, "W", secondary);
            AddLabel(T("地平面", "Ground plane"), left, substrateBottom + 15, right - left, 14, secondary);
        }
        else
        {
            AddRectangle(left, substrateTop - metalHeight, center - signalHalfWidth - gap - left, metalHeight, metal, outline);
            AddRectangle(center - signalHalfWidth, substrateTop - metalHeight, signalHalfWidth * 2, metalHeight, metal, outline);
            AddRectangle(center + signalHalfWidth + gap, substrateTop - metalHeight, right - (center + signalHalfWidth + gap), metalHeight, metal, outline);
            if (savedLineType == (int)LineType.Gcpw)
                AddRectangle(left, substrateBottom, right - left, metalHeight, metal, outline);

            AddDimensionHorizontal(center - signalHalfWidth, center + signalHalfWidth, substrateTop - 29, "W", secondary);
            AddDimensionHorizontal(center + signalHalfWidth, center + signalHalfWidth + gap, substrateTop - 9, "S", secondary);
            AddLabel(savedLineType == (int)LineType.Gcpw ? "GCPW" : "CPW", left, substrateBottom + 14, right - left, 14, secondary);
        }

        AddDimensionVertical(left - 18, substrateTop, substrateBottom, "h", secondary);
        AddLabel("εᵣ", left + 8, substrateTop + (substrateBottom - substrateTop) / 2 - 10, 48, 16, primary);
    }

    private void DrawSiwDiagram(double width, double height, Brush metal, Brush dielectric, Brush outline, Brush primary, Brush secondary)
    {
        double left = width * 0.12;
        double right = width * 0.70;
        double top = height * 0.31;
        double bottom = height * 0.69;
        double radius = Math.Clamp(width * 0.027, 6, 9);
        AddRectangle(left, top - 15, right - left, bottom - top + 30, dielectric, outline);

        const int viaCount = 7;
        double interval = (right - left) / (viaCount - 1);
        for (int i = 0; i < viaCount; i++)
        {
            double x = left + i * interval;
            AddEllipse(x - radius, top - radius, radius * 2, radius * 2, metal, outline);
            AddEllipse(x - radius, bottom - radius, radius * 2, radius * 2, metal, outline);
        }

        AddLine(left + 8, (top + bottom) / 2, right - 8, (top + bottom) / 2, secondary, 1.5);
        AddLabel(T("传播方向", "Propagation"), left + (right - left) * 0.25, (top + bottom) / 2 + 4, (right - left) * 0.5, 14, primary);
        AddDimensionHorizontal(left, left + interval, top - 34, "p", secondary);
        AddDimensionVertical(right + 18, top, bottom, "a", secondary);
        AddDimensionHorizontal(left - radius, left + radius, bottom + 32, "d", secondary);
        AddLabel(T("通孔围栏", "Via fence"), left, bottom + 52, right - left, 14, secondary);
    }

    private void AddRectangle(double left, double top, double width, double height, Brush fill, Brush outline)
    {
        var shape = new Rectangle { Width = width, Height = height, Fill = fill, Stroke = outline, StrokeThickness = 1 };
        Canvas.SetLeft(shape, left);
        Canvas.SetTop(shape, top);
        diagramCanvas!.Children.Add(shape);
    }

    private void AddEllipse(double left, double top, double width, double height, Brush fill, Brush outline)
    {
        var shape = new Ellipse { Width = width, Height = height, Fill = fill, Stroke = outline, StrokeThickness = 1 };
        Canvas.SetLeft(shape, left);
        Canvas.SetTop(shape, top);
        diagramCanvas!.Children.Add(shape);
    }

    private void AddLine(double x1, double y1, double x2, double y2, Brush stroke, double thickness)
    {
        diagramCanvas!.Children.Add(new Line { X1 = x1, Y1 = y1, X2 = x2, Y2 = y2, Stroke = stroke, StrokeThickness = thickness });
    }

    private void AddLabel(string text, double left, double top, double width, double fontSize, Brush foreground)
    {
        var label = new TextBlock
        {
            Text = text,
            Width = Math.Max(24, width),
            FontSize = fontSize,
            Foreground = foreground,
            TextAlignment = TextAlignment.Center,
            TextWrapping = TextWrapping.Wrap,
            IsTextScaleFactorEnabled = true
        };
        Canvas.SetLeft(label, left);
        Canvas.SetTop(label, top);
        diagramCanvas!.Children.Add(label);
    }

    private void AddDimensionHorizontal(double x1, double x2, double y, string label, Brush brush)
    {
        AddLine(x1, y, x2, y, brush, 1.25);
        AddLine(x1, y - 5, x1, y + 5, brush, 1.25);
        AddLine(x2, y - 5, x2, y + 5, brush, 1.25);
        AddLabel(label, (x1 + x2) / 2 - 24, y - 22, 48, 14, brush);
    }

    private void AddDimensionVertical(double x, double y1, double y2, string label, Brush brush)
    {
        AddLine(x, y1, x, y2, brush, 1.25);
        AddLine(x - 5, y1, x + 5, y1, brush, 1.25);
        AddLine(x - 5, y2, x + 5, y2, brush, 1.25);
        AddLabel(label, x + 5, (y1 + y2) / 2 - 10, 38, 14, brush);
    }
}
