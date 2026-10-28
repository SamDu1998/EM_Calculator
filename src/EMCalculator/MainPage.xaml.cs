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
    private ComboBox? lineMode;
    private bool building;
    private bool? isWideLayout;
    private string? displayedPage;
    private readonly Dictionary<string, Dictionary<string, (string text, int unit)>> savedInputs = new();
    private int savedLineType;
    private int savedLineMode;
    private SiwResult? lastSiw;
    private PatchAntennaResult? lastPatch;
    private LinearArrayResult? lastArray;
    private LineSynthesisResult? lastLineSynthesis;
    private FriisLinkResult? lastFriis;

    public MainPage()
    {
        InitializeComponent();
        UpdateLanguage();
        Navigation.SelectedItem = BandwidthNav;
        RenderPage();
    }

    private string T(string zh, string en) => chinese ? zh : en;

    private string PageSubtitle() => page switch
    {
        "patch" => T("TM₁₀ 矩形贴片初算；不含馈电与损耗修正。", "Initial TM10 patch sizing; feed and loss effects are not modeled."),
        "array" => T("均匀线阵阵因子初算；不含单元方向图与互耦。", "Uniform linear-array estimate; element pattern and mutual coupling are not modeled."),
        "line" when savedLineMode == 1 => T("按目标阻抗综合导体尺寸；线宽/同轴内径由模型反求。", "Synthesize the conductor dimension for a target impedance using the selected line model."),
        "friis" => T("自由空间视距链路估算；不含多径、遮挡或环境损耗。", "Free-space line-of-sight estimate; multipath, obstruction, and environmental losses are not modeled."),
        _ => T("输入参数，结果将实时更新。", "Results update as you enter parameters.")
    };

    private void UpdateLanguage()
    {
        BasicsHeader.Content = T("基础估算", "Basic estimates");
        BandwidthNav.Content = T("相对带宽", "Bandwidth");
        ApertureNav.Content = T("口径效率", "Aperture efficiency");
        WavelengthNav.Content = T("波长", "Wavelength");
        AntennaDesignHeader.Content = T("天线设计", "Antenna design");
        PatchNav.Content = T("矩形贴片初算", "Patch antenna");
        ArrayNav.Content = T("均匀线阵初算", "Linear array");
        StructuresHeader.Content = T("馈电与导波结构", "Feeds & guided structures");
        LineNav.Content = T("传输线阻抗", "Transmission line");
        SiwNav.Content = T("SIW 通孔设计", "SIW via design");
        SystemHeader.Content = T("系统估算", "System estimates");
        FriisNav.Content = T("Friis 链路预算", "Friis link budget");
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
        lineMode = null;
        pageLayout = null;
        inputCard = null;
        resultCard = null;
        diagramCard = null;
        diagramCanvas = null;
        diagramDescription = null;
        primaryResultValue = null;
        lastSiw = null;
        lastPatch = null;
        lastArray = null;
        lastLineSynthesis = null;
        lastFriis = null;
        isWideLayout = null;

        displayedPage = page == "line" ? $"line:{savedLineType}:{savedLineMode}" : page;
        string title = page switch
        {
            "aperture" => T("口径效率", "Aperture efficiency"),
            "wavelength" => T("波长", "Wavelength"),
            "patch" => T("矩形微带贴片初算", "Rectangular patch sizing"),
            "array" => T("均匀线阵初算", "Uniform linear array"),
            "friis" => T("Friis 链路预算", "Friis link budget"),
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
            Text = PageSubtitle(),
            Opacity = 0.72,
            Margin = new Thickness(0, -8, 0, 4),
            TextWrapping = TextWrapping.Wrap,
            IsTextScaleFactorEnabled = true
        });

        inputs = new StackPanel { Spacing = 14 };
        results = new StackPanel { Spacing = 12 };
        string[] freq = ["Hz", "kHz", "MHz", "GHz"];
        string[] length = ["mm", "µm", "mil"];
        string[] distance = ["m", "km"];

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
        else if (page == "patch")
        {
            Field("f", T("目标谐振频率 f₀", "Target resonant frequency f₀"), "2.4", freq, 3);
            Field("er", T("基板相对介电常数 εᵣ", "Substrate relative permittivity εᵣ"), "4.4");
            Field("height", T("基板厚度 h", "Substrate thickness h"), "1.6", length);
        }
        else if (page == "array")
        {
            Field("f", T("工作频率 f₀", "Operating frequency f₀"), "10", freq, 3);
            Field("elements", T("阵元数 N（2–32）", "Number of elements N (2–32)"), "8");
            Field("spacing", T("阵元间距 d/λ₀", "Element spacing d/λ₀"), "0.5");
            Field("scan", T("扫描角 θ₀（相对阵列法线，°）", "Scan angle θ₀ (from broadside, °)"), "0");
        }
        else if (page == "friis")
        {
            Field("f", T("频率 f₀", "Frequency f₀"), "2.4", freq, 3);
            Field("distance", T("收发距离 R", "Tx/Rx distance R"), "1", distance);
            Field("txPower", T("发射功率 Pt", "Transmit power Pt"), "20");
            Field("txGain", T("发射天线增益 Gt", "Transmit antenna gain Gt"), "2");
            Field("rxGain", T("接收天线增益 Gr", "Receive antenna gain Gr"), "2");
            Field("loss", T("其他系统损耗 L", "Other system losses L"), "0");
            Field("sensitivity", T("接收灵敏度", "Receiver sensitivity"), "-90");
        }
        else if (page == "siw")
        {
            Field("f", T("工作频率", "Operating frequency"), "10", freq, 3);
            Field("er", T("相对介电常数 εᵣ", "Relative permittivity εᵣ"), "3.38");
            Field("width", T("通孔中心间宽度 a", "Via center-to-center width a"), "13", length);
        }
        else if (page == "line")
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

            lineMode = new ComboBox
            {
                Header = T("计算方式", "Operation"),
                HorizontalAlignment = HorizontalAlignment.Stretch,
                IsTextScaleFactorEnabled = true
            };
            lineMode.Items.Add(T("计算阻抗", "Calculate impedance"));
            lineMode.Items.Add(T("综合尺寸", "Synthesize dimension"));
            lineMode.SelectedIndex = savedLineMode;
            inputs.Children.Add(lineMode);

            string width = savedLineType switch { 0 => "3.06", 3 => "1", _ => "0.5" };
            string height = savedLineType switch { 0 => "1.6", 3 => "3.490343", _ => "0.635" };
            string er = savedLineType switch { 0 => "4.4", 3 => "2.25", _ => "9.8" };
            if (savedLineMode == 0)
                Field("width", T("线宽 W / 内导体直径 d", "Width W / inner diameter d"), width, length);
            else
                Field("targetZ0", T("目标特性阻抗 Z₀", "Target characteristic impedance Z₀"), "50");
            if (savedLineType is 1 or 2)
                Field("gap", T("间隙 S", "Gap S"), "0.25", length);
            Field("height", T("基板厚度 h / 外导体内径 D", "Substrate height h / outer conductor inner diameter D"), height, length);
            Field("er", T("相对介电常数 εᵣ", "Relative permittivity εᵣ"), er);

            lineType.SelectionChanged += (_, _) =>
            {
                if (building || lineType == null) return;
                SaveInputs();
                savedLineType = lineType.SelectedIndex;
                RenderPage(false);
            };
            lineMode.SelectionChanged += (_, _) =>
            {
                if (building || lineMode == null) return;
                SaveInputs();
                savedLineMode = lineMode.SelectedIndex;
                RenderPage(false);
            };
        }

        inputCard = SectionCard(T("输入参数", "Parameters"), inputs);
        resultCard = SectionCard(T("计算结果", "Results"), results);
        pageLayout = new Grid { ColumnSpacing = 18, RowSpacing = 16, HorizontalAlignment = HorizontalAlignment.Stretch };
        pageLayout.Children.Add(inputCard);
        pageLayout.Children.Add(resultCard);

        if (page is "line" or "siw" or "patch" or "array" or "friis")
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
        if (lineType == null || lineMode == null || !fields.ContainsKey("height")) return;
        int type = lineType.SelectedIndex;
        bool synthesize = lineMode.SelectedIndex == 1;
        if (synthesize && fields.TryGetValue("targetZ0", out var targetField))
            targetField.input.Header = T("目标特性阻抗 Z₀", "Target characteristic impedance Z₀");
        if (!synthesize && fields.TryGetValue("width", out var widthField))
            widthField.input.Header = type == (int)LineType.Coaxial
                ? T("内导体直径 d", "Inner conductor diameter d")
                : T("线宽 W", "Conductor width W");
        fields["height"].input.Header = type == 3
            ? T("外导体内径 D", "Outer conductor inner diameter D")
            : T("基板厚度 h", "Substrate height h");
        if (fields.TryGetValue("gap", out var gapField))
            ((Grid)gapField.input.Parent).Visibility = type is 1 or 2 ? Visibility.Visible : Visibility.Collapsed;
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
        "outer_not_positive" => T("外导体内径必须大于零。", "Outer conductor inner diameter must be positive."),
        "outer_not_greater_than_inner" => T("外导体内径必须大于内导体直径。", "Outer conductor inner diameter must exceed the inner conductor diameter."),
        "width_too_small_for_vias" => T("波导宽度对推荐通孔尺寸过小。", "Waveguide width is too small for the recommended vias."),
        "patch_length_not_positive" => T("当前参数无法得到正的贴片长度，请检查频率和基板参数。", "These inputs produce a non-positive patch length; check the frequency and substrate values."),
        "target_impedance_not_positive" => T("目标特性阻抗必须大于零。", "Target characteristic impedance must be positive."),
        "target_impedance_unreachable" => T("目标阻抗超出当前结构与模型范围可实现的范围。", "The target impedance is outside the range achievable by this geometry and model."),
        "distance_not_positive" => T("收发距离必须大于零。", "Link distance must be positive."),
        "transmit_power_not_finite" => T("请输入有效的发射功率。", "Enter a finite transmit power."),
        "system_loss_invalid" => T("其他系统损耗必须是大于或等于零的有效数值。", "System losses must be a finite non-negative value."),
        "sensitivity_not_finite" => T("请输入有效的接收灵敏度。", "Enter a finite receiver sensitivity."),
        "element_count_invalid" => T("阵元数必须是 2 到 32 之间的整数。", "Element count must be an integer from 2 through 32."),
        "spacing_ratio_not_positive" => T("阵元间距 d/λ₀ 必须大于零。", "Element spacing d/λ₀ must be positive."),
        "scan_angle_out_of_range" => T("扫描角必须在 −90° 到 90° 之间。", "Scan angle must be between −90° and 90°."),
        "out_of_range" => T("输入超出计算范围。", "Inputs are outside the calculation range."),
        _ => T("请输入有效数字，可使用科学计数法。", "Enter valid numbers; scientific notation is supported.")
    };

    private void Calculate()
    {
        if (building || results == null) return;
        results.Children.Clear();
        outputCount = 0;
        lastSiw = null;
        lastPatch = null;
        lastArray = null;
        lastLineSynthesis = null;
        lastFriis = null;

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
                case "patch":
                    lastPatch = Calculations.RectangularPatch(Value("f"), Value("er"), Value("height"));
                    Output(T("贴片长度 L（TM₁₀）", "Patch length L (TM10)"), lastPatch.LengthM * 1000, "mm");
                    Output(T("贴片宽度 W", "Patch width W"), lastPatch.WidthM * 1000, "mm");
                    Output(T("有效相对介电常数 εeff", "Effective relative permittivity εeff"), lastPatch.EpsilonEff, "");
                    Output(T("单侧边缘延伸 ΔL", "Edge extension per side ΔL"), lastPatch.LengthExtensionM * 1000, "mm");
                    Output(T("等效电长度 Leff", "Effective electrical length Leff"), lastPatch.EffectiveLengthM * 1000, "mm");
                    if (lastPatch.OutsideValidatedRange)
                        Warn(T("宽高比或介电常数超出本初算模型的常用范围；结果仅作初始尺寸参考。", "The width-to-height ratio or permittivity is outside the usual range for this preliminary model; treat the result as an initial estimate."));
                    break;
                case "array":
                    lastArray = Calculations.UniformLinearArray(Value("f"), Value("elements"), Value("spacing"), Value("scan"));
                    Output(T("阵列总长度 (N−1)d", "Array aperture length (N−1)d"), lastArray.ApertureLengthM * 1000, "mm");
                    Output(T("物理阵元间距 d", "Physical element spacing d"), lastArray.ElementSpacingM * 1000, "mm");
                    Output(T("渐进相位步进 Δφ", "Progressive phase step Δφ"), lastArray.ProgressivePhaseDegrees, "°");
                    Output(T("无栅瓣间距上限 d/λ₀", "Grating-lobe-free spacing limit d/λ₀"), lastArray.GratingLobeLimitSpacingRatio, "");
                    if (lastArray.GratingLobesPossible)
                        Warn(T("当前间距在该扫描角下可能产生栅瓣。", "This spacing may produce grating lobes at the selected scan angle."));
                    break;
                case "siw":
                    lastSiw = Calculations.Siw(Value("f"), Value("er"), Value("width"));
                    Output(T("通孔直径 d", "Via diameter d"), lastSiw.ViaDiameterM * 1000, "mm");
                    Output(T("通孔间距 p", "Via pitch p"), lastSiw.ViaPitchM * 1000, "mm");
                    Output(T("等效宽度", "Effective width"), lastSiw.EffectiveWidthM * 1000, "mm");
                    FrequencyOutput(T("截止频率", "Cutoff frequency"), lastSiw.CutoffFrequencyHz);
                    if (lastSiw.BelowCutoff) Warn(T("工作频率不高于截止频率。", "Operating frequency is at or below cutoff."));
                    break;
                case "friis":
                    CalculateFriis();
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
        var type = (LineType)savedLineType;
        double height = Value("height"), er = Value("er");
        if (savedLineMode == 1)
        {
            double target = Value("targetZ0");
            double gap = type is LineType.Cpw or LineType.Gcpw ? Value("gap") : 0;
            lastLineSynthesis = Calculations.SynthesizeLineDimension(target, height, er, type, gap);
            string dimensionLabel = type == LineType.Coaxial
                ? T("综合内导体直径 d", "Synthesized inner conductor diameter d")
                : T("综合线宽 W", "Synthesized conductor width W");
            Output(dimensionLabel, lastLineSynthesis.DimensionM * 1000, "mm");
            Output(T("目标阻抗 Z₀", "Target impedance Z₀"), target, "Ω");
            Output(T("回算阻抗 Z₀", "Recalculated impedance Z₀"), lastLineSynthesis.Z0Ohm, "Ω");
            Output(T("有效介电常数", "Effective permittivity"), lastLineSynthesis.EpsilonEff, "");
            Output(T("相速度", "Phase velocity"), lastLineSynthesis.PhaseVelocityMPerS, "m/s");
            if (lastLineSynthesis.OutsideValidatedRange)
                Warn(T("输入超出模型验证范围：0.01 ≤ W/h ≤ 100，εᵣ ≤ 128。", "Outside the validated range: 0.01 ≤ W/h ≤ 100, εᵣ ≤ 128."));
            return;
        }

        double width = Value("width");
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

    private void CalculateFriis()
    {
        lastFriis = Calculations.FriisLinkBudget(Value("f"), Value("distance"), Value("txPower"), Value("txGain"),
            Value("rxGain"), Value("loss"), Value("sensitivity"));
        Output(T("接收功率 Pr", "Received power Pr"), lastFriis.ReceivedPowerDbm, "dBm");
        Output(T("自由空间路径损耗 Lfs", "Free-space path loss Lfs"), lastFriis.FreeSpacePathLossDb, "dB");
        Output(T("链路余量", "Link margin"), lastFriis.LinkMarginDb, "dB");
        Output(T("自由空间波长 λ₀", "Free-space wavelength λ₀"), lastFriis.WavelengthM * 1000, "mm");
        if (lastFriis.BelowSensitivity)
            Warn(T("接收功率低于接收灵敏度。", "Received power is below receiver sensitivity."));
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
            string parameters;
            if (savedLineMode == 0)
            {
                parameters = type switch
                {
                    0 => $"W = {FieldText("width")}; h = {FieldText("height")}; εᵣ = {FieldText("er")}",
                    1 or 2 => $"W = {FieldText("width")}; S = {FieldText("gap")}; h = {FieldText("height")}; εᵣ = {FieldText("er")}",
                    _ => $"d = {FieldText("width")}; D = {FieldText("height")}; εᵣ = {FieldText("er") }"
                };
            }
            else
            {
                parameters = $"Z₀ = {FieldText("targetZ0")}; h/D = {FieldText("height")}; εᵣ = {FieldText("er")}";
                if (type is 1 or 2) parameters += $"; S = {FieldText("gap")}";
                if (lastLineSynthesis != null)
                {
                    string dimension = type == (int)LineType.Coaxial ? "d" : "W";
                    parameters += $"; {dimension} = {Millimeters(lastLineSynthesis.DimensionM)} mm; Z₀ = {lastLineSynthesis.Z0Ohm.ToString("G5", CultureInfo.InvariantCulture)} Ω";
                }
            }
            diagramDescription.Text = $"{name} · {T("结构示意，非比例绘制。", "schematic, not to scale.")} {parameters}";
            AutomationProperties.SetName(diagramCanvas, $"{name} {T("传输线结构示意图", "transmission-line schematic")}. {parameters}");
        }
        else if (page == "siw")
        {
            string parameters = $"a = {FieldText("width")}; εᵣ = {FieldText("er")}; f = {FieldText("f")}";
            if (lastSiw != null)
                parameters += $"; d = {Millimeters(lastSiw.ViaDiameterM)} mm; p = {Millimeters(lastSiw.ViaPitchM)} mm";
            diagramDescription.Text = $"{T("SIW 通孔阵列俯视图；示意图非比例绘制。", "SIW via-fence top view; schematic not to scale.")} {parameters}";
            AutomationProperties.SetName(diagramCanvas, $"{T("SIW 通孔阵列俯视结构示意图", "SIW via-fence top-view schematic")}. {parameters}");
        }
        else if (page == "patch")
        {
            string parameters = $"f₀ = {FieldText("f")}; εᵣ = {FieldText("er")}; h = {FieldText("height")}";
            if (lastPatch != null)
                parameters += $"; W = {Millimeters(lastPatch.WidthM)} mm; L = {Millimeters(lastPatch.LengthM)} mm; εeff = {lastPatch.EpsilonEff.ToString("G5", CultureInfo.InvariantCulture)}; ΔL = {Millimeters(lastPatch.LengthExtensionM)} mm";
            diagramDescription.Text = $"{T("矩形贴片俯视图与横截面；TM₁₀ 初算，示意图非比例绘制。", "Rectangular patch top and cross-section; TM10 initial sizing, schematic not to scale.")} {parameters}";
            AutomationProperties.SetName(diagramCanvas, $"{T("矩形微带贴片尺寸示意图", "Rectangular microstrip patch dimension schematic")}. {parameters}");
        }
        else if (page == "array")
        {
            string parameters = $"N = {FieldText("elements")}; f₀ = {FieldText("f")}; d/λ₀ = {FieldText("spacing")}; θ₀ = {FieldText("scan")}°";
            if (lastArray != null)
                parameters += $"; d = {Millimeters(lastArray.ElementSpacingM)} mm; (N−1)d = {Millimeters(lastArray.ApertureLengthM)} mm; Δφ = {lastArray.ProgressivePhaseDegrees.ToString("G5", CultureInfo.InvariantCulture)}°";
            diagramDescription.Text = $"{T("均匀线阵示意图；扫描角相对阵列法线，非比例绘制。", "Uniform linear-array schematic; scan angle is from broadside, not to scale.")} {parameters}";
            AutomationProperties.SetName(diagramCanvas, $"{T("均匀线阵与扫描方向示意图", "Uniform linear-array and scan direction schematic")}. {parameters}");
        }
        else if (page == "friis")
        {
            string parameters = $"f₀ = {FieldText("f")}; R = {FieldText("distance")}; Pt = {FieldText("txPower")} dBm; Gt/Gr = {FieldText("txGain")}/{FieldText("rxGain")} dBi; L = {FieldText("loss")} dB";
            if (lastFriis != null)
                parameters += $"; Pr = {lastFriis.ReceivedPowerDbm.ToString("G5", CultureInfo.InvariantCulture)} dBm; Margin = {lastFriis.LinkMarginDb.ToString("G5", CultureInfo.InvariantCulture)} dB";
            diagramDescription.Text = $"{T("Friis 自由空间视距链路示意。", "Friis free-space line-of-sight link schematic.")} {parameters}";
            AutomationProperties.SetName(diagramCanvas, $"{T("发射端到接收端的链路示意图", "Transmitter-to-receiver link schematic")}. {parameters}");
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

        Brush metal = new SolidColorBrush(Color.FromArgb(150, 239, 140, 48));
        Brush dielectric = new SolidColorBrush(Color.FromArgb(105, 125, 132, 140));
        Brush outline = ThemeBrush("ControlStrokeColorDefaultBrush", Color.FromArgb(255, 115, 125, 135));
        Brush primary = ThemeBrush("TextFillColorPrimaryBrush", Color.FromArgb(255, 30, 30, 30));
        Brush secondary = ThemeBrush("TextFillColorSecondaryBrush", Color.FromArgb(255, 100, 100, 100));

        if (page == "siw")
            DrawSiwDiagram(width, height, metal, dielectric, outline, primary, secondary);
        else if (page == "patch")
            DrawPatchAntennaDiagram(width, height, metal, dielectric, outline, primary, secondary);
        else if (page == "array")
            DrawLinearArrayDiagram(width, height, metal, outline, primary, secondary);
        else if (page == "friis")
            DrawFriisDiagram(width, height, metal, outline, primary, secondary);
        else
            DrawTransmissionLineDiagram(width, height, metal, dielectric, outline, primary, secondary);
    }

    private void DrawLinearArrayDiagram(double width, double height, Brush metal, Brush outline, Brush primary, Brush secondary)
    {
        int count = lastArray?.ElementCount ?? ElementCountForDiagram();
        double left = width * 0.12;
        double right = width * 0.88;
        double arrayY = height * 0.66;
        double interval = (right - left) / (count - 1);
        double radius = Math.Clamp(interval * 0.28, 1.6, 7);

        for (int i = 0; i < count; i++)
        {
            double x = left + i * interval;
            AddEllipse(x - radius, arrayY - radius, radius * 2, radius * 2, metal, outline);
        }
        AddLine(left, arrayY + 2, right, arrayY + 2, secondary, 1);

        if (count > 1)
            AddDimensionHorizontal(left, left + interval, arrayY + 25, "d", secondary);
        AddLabel("N = " + count.ToString(CultureInfo.InvariantCulture), left, arrayY + 48, right - left, 14, primary);

        double center = (left + right) / 2;
        double broadsideTop = height * 0.12;
        AddLine(center, arrayY - 8, center, broadsideTop, secondary, 1);
        AddLabel(T("阵列法线", "Broadside"), center - 42, broadsideTop - 21, 84, 12, secondary);

        double scanAngle = lastArray?.ScanAngleDegrees ?? ParseForDiagram("scan", 0);
        double radians = scanAngle * Math.PI / 180;
        double beamLength = height * 0.36;
        double tipX = center + beamLength * Math.Sin(radians);
        double tipY = arrayY - beamLength * Math.Cos(radians);
        AddLine(center, arrayY - 8, tipX, tipY, primary, 2);
        double beamDirection = radians - Math.PI / 2;
        AddLine(tipX, tipY, tipX - 9 * Math.Cos(beamDirection + Math.PI / 6), tipY - 9 * Math.Sin(beamDirection + Math.PI / 6), primary, 2);
        AddLine(tipX, tipY, tipX - 9 * Math.Cos(beamDirection - Math.PI / 6), tipY - 9 * Math.Sin(beamDirection - Math.PI / 6), primary, 2);
        AddLabel("θ₀", tipX - 20, tipY - 24, 40, 14, primary);
    }

    private double ParseForDiagram(string key, double fallback)
    {
        try { return Value(key); }
        catch (CalculationException) { return fallback; }
    }

    private int ElementCountForDiagram()
    {
        if (fields.TryGetValue("elements", out var field)
            && double.TryParse(field.input.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out double count)
            && double.IsFinite(count)
            && count == Math.Truncate(count)
            && count is >= 2 and <= 32)
            return (int)count;
        return 8;
    }

    private void DrawFriisDiagram(double width, double height, Brush conductor, Brush outline, Brush primary, Brush secondary)
    {
        double txX = width * 0.22;
        double rxX = width * 0.78;
        double centerY = height * 0.48;

        AddLine(txX, centerY - 30, txX, centerY + 20, conductor, 4);
        AddLine(txX - 13, centerY - 30, txX + 13, centerY - 30, conductor, 3);
        AddEllipse(txX - 5, centerY - 5, 10, 10, conductor, outline);
        AddLine(rxX, centerY - 30, rxX, centerY + 20, conductor, 4);
        AddLine(rxX - 13, centerY - 30, rxX + 13, centerY - 30, conductor, 3);
        AddEllipse(rxX - 5, centerY - 5, 10, 10, conductor, outline);

        AddLine(txX + 22, centerY, rxX - 22, centerY, secondary, 1.75);
        AddLine(rxX - 22, centerY, rxX - 31, centerY - 5, secondary, 1.75);
        AddLine(rxX - 22, centerY, rxX - 31, centerY + 5, secondary, 1.75);
        AddLabel(T("发射端 Tx", "Transmitter Tx"), txX - 42, centerY + 25, 84, 13, primary);
        AddLabel(T("接收端 Rx", "Receiver Rx"), rxX - 42, centerY + 25, 84, 13, primary);
        AddLabel(T("自由空间传播", "Free-space path"), width * 0.36, centerY - 62, width * 0.28, 14, secondary);
        AddDimensionHorizontal(txX, rxX, centerY + 67, "R", secondary);
    }

    private void DrawPatchAntennaDiagram(double width, double height, Brush metal, Brush dielectric, Brush outline, Brush primary, Brush secondary)
    {
        double boardLeft = width * 0.17;
        double boardWidth = width * 0.66;
        double patchLeft = width * 0.35;
        double patchWidth = width * 0.30;
        double patchTop = height * 0.27;
        double patchHeight = height * 0.24;

        AddRectangle(boardLeft, height * 0.18, boardWidth, height * 0.38, dielectric, outline);
        AddRectangle(patchLeft, patchTop, patchWidth, patchHeight, metal, outline);
        AddDimensionHorizontal(patchLeft, patchLeft + patchWidth, height * 0.16, "W", secondary);
        AddDimensionVertical(patchLeft + patchWidth + 18, patchTop, patchTop + patchHeight, "L", secondary);

        double sectionTop = height * 0.70;
        double substrateTop = sectionTop + 8;
        double substrateHeight = height * 0.16;
        AddRectangle(boardLeft, substrateTop, boardWidth, substrateHeight, dielectric, outline);
        AddRectangle(patchLeft, sectionTop, patchWidth, 8, metal, outline);
        AddRectangle(boardLeft, substrateTop + substrateHeight, boardWidth, 8, metal, outline);
        AddDimensionVertical(boardLeft - 14, substrateTop, substrateTop + substrateHeight, "h", secondary);
        AddLabel("εᵣ", boardLeft + 18, substrateTop + substrateHeight / 2 - 10, 42, 14, primary);
        AddLabel(T("俯视 / 横截面", "Top / cross-section"), boardLeft, height * 0.91, boardWidth, 13, secondary);
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
