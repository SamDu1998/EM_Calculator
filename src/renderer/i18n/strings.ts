export const strings = {
  en: {
    'app.title': 'EM Calculator',
    'app.subtitle': 'Electromagnetic engineering quantities',
    'app.author': 'Author: Sam · Version 0.2',

    'tabs.bandwidth': 'Relative Bandwidth',
    'tabs.efficiency': 'Aperture Efficiency',
    'tabs.wavelength': 'Wavelength',
    'tabs.transmission': 'Line Impedance',
    'tabs.siw': 'SIW Vias',
    'tabs.tbd': 'More',

    'lang.menu': 'Language',

    'common.unit': 'Unit',

    'bandwidth.heading': 'Relative bandwidth',
    'bandwidth.description':
      'For a band fmin – fmax, computes absolute width, center frequency, and (fmax−fmin)/fcenter × 100%.',
    'bandwidth.fmin': 'Minimum frequency',
    'bandwidth.fmax': 'Maximum frequency',
    'bandwidth.result.absolute': 'Absolute bandwidth',
    'bandwidth.result.relative': 'Relative bandwidth',
    'bandwidth.result.center': 'Center frequency',
    'bandwidth.errors.fmin_not_positive': 'Minimum frequency must be greater than zero.',
    'bandwidth.errors.fmax_not_greater_than_fmin':
      'Maximum frequency must be larger than the minimum.',

    'efficiency.heading': 'Aperture efficiency',
    'efficiency.description':
      'η = Ae / Aphys, where Ae = λ²/(4π) · 10^(G/10) and λ = c/f.',
    'efficiency.frequency': 'Frequency',
    'efficiency.gain': 'Antenna gain (dBi)',
    'efficiency.area': 'Physical aperture area',
    'efficiency.result.wavelength': 'Wavelength λ',
    'efficiency.result.effective_area': 'Effective aperture area Ae',
    'efficiency.result.efficiency': 'Aperture efficiency η',
    'efficiency.warning.over_unity':
      'Computed efficiency exceeds 100%. Inputs are physically inconsistent — re-check gain or area.',
    'efficiency.errors.frequency_not_positive': 'Frequency must be greater than zero.',
    'efficiency.errors.area_not_positive': 'Physical aperture area must be greater than zero.',
    'efficiency.errors.gain_not_finite': 'Gain must be a finite number.',

    'wavelength.heading': 'Wavelength',
    'wavelength.description':
      'λ₀ = c/f and λg = λ₀/√εᵣ for a TEM wave in a uniform dielectric, with λg/2, λg/4, and phase velocity.',
    'wavelength.frequency': 'Frequency',
    'wavelength.dielectric': 'Relative permittivity εᵣ',
    'wavelength.result.lambda0': 'Free-space wavelength λ₀',
    'wavelength.result.lambdag': 'Guided wavelength λg',
    'wavelength.result.half': 'Half wavelength λg/2',
    'wavelength.result.quarter': 'Quarter wavelength λg/4',
    'wavelength.result.phase_velocity': 'Phase velocity vₚ',
    'wavelength.errors.frequency_not_positive': 'Frequency must be greater than zero.',
    'wavelength.errors.er_less_than_one': 'Relative permittivity must be ≥ 1.',

    'transmission.heading': 'Transmission line impedance',
    'transmission.description':
      'Characteristic impedance Z₀, effective permittivity εeff, and phase velocity. Microstrip uses the Hammerstad–Jensen model; coaxial uses Z₀ = 60/√εᵣ · ln(D/d).',
    'transmission.type': 'Line type',
    'transmission.type.microstrip': 'Microstrip',
    'transmission.type.coaxial': 'Coaxial',
    'transmission.microstrip.width': 'Trace width W',
    'transmission.microstrip.height': 'Substrate height h',
    'transmission.coaxial.inner': 'Inner conductor diameter d',
    'transmission.coaxial.outer': 'Outer conductor inner diameter D',
    'transmission.dielectric': 'Relative permittivity εᵣ',
    'transmission.result.z0': 'Characteristic impedance Z₀',
    'transmission.result.eeff': 'Effective permittivity εeff',
    'transmission.result.vp': 'Phase velocity vₚ',
    'transmission.warning.range':
      'W/h is outside the validated range of the Hammerstad–Jensen model (0.01 – 100); results may be inaccurate.',
    'transmission.errors.width_not_positive': 'Trace width must be greater than zero.',
    'transmission.errors.height_not_positive': 'Substrate height must be greater than zero.',
    'transmission.errors.inner_not_positive': 'Inner diameter must be greater than zero.',
    'transmission.errors.outer_not_greater_than_inner':
      'Outer diameter must be larger than the inner diameter.',
    'transmission.errors.er_less_than_one': 'Relative permittivity must be ≥ 1.',

    'siw.heading': 'SIW via design',
    'siw.description':
      'Via rules per Deslandes & Wu: d ≈ λd/10, p = 1.5·d, equivalent width aeff = a − d²/(0.95·p), and TE₁₀ cutoff fc = c/(2·aeff·√εᵣ).',
    'siw.frequency': 'Operating frequency',
    'siw.dielectric': 'Relative permittivity εᵣ',
    'siw.width': 'Via center-to-center width a',
    'siw.result.diameter': 'Recommended via diameter d',
    'siw.result.pitch': 'Recommended via pitch p',
    'siw.result.effective_width': 'Equivalent width aeff',
    'siw.result.cutoff': 'Cutoff frequency fc',
    'siw.warning.below_cutoff':
      'The operating frequency is at or below the TE₁₀ cutoff — the wave will not propagate. Increase the width a.',
    'siw.errors.frequency_not_positive': 'Frequency must be greater than zero.',
    'siw.errors.er_less_than_one': 'Relative permittivity must be ≥ 1.',
    'siw.errors.width_not_positive': 'Width must be greater than zero.',
    'siw.errors.width_too_small_for_vias':
      'Width is too small for the recommended via size at this frequency.',

    'tbd.placeholder': 'More calculations are on the way.',

    'verify.button': 'Verify with Python',
    'verify.checking': 'Checking…',
    'verify.match': 'Python agrees within 10⁻⁹',
    'verify.mismatch': 'Mismatch with Python reference',
    'verify.unavailable': 'Python is unavailable in this environment',
    'verify.error': 'Verification failed',
  },
  zh: {
    'app.title': '电磁计算器',
    'app.subtitle': '电磁工程量计算',
    'app.author': '作者：Sam · 版本 0.2',

    'tabs.bandwidth': '相对带宽',
    'tabs.efficiency': '口径效率',
    'tabs.wavelength': '波长',
    'tabs.transmission': '线路阻抗',
    'tabs.siw': 'SIW 通孔',
    'tabs.tbd': '更多',

    'lang.menu': '语言',

    'common.unit': '单位',

    'bandwidth.heading': '相对带宽',
    'bandwidth.description':
      '对频段 fmin – fmax，计算绝对带宽、中心频率以及 (fmax−fmin)/fcenter × 100%。',
    'bandwidth.fmin': '最低工作频率',
    'bandwidth.fmax': '最高工作频率',
    'bandwidth.result.absolute': '绝对带宽',
    'bandwidth.result.relative': '相对带宽',
    'bandwidth.result.center': '中心频率',
    'bandwidth.errors.fmin_not_positive': '最低频率必须大于 0。',
    'bandwidth.errors.fmax_not_greater_than_fmin': '最高频率必须大于最低频率。',

    'efficiency.heading': '口径效率',
    'efficiency.description': 'η = Ae / Aphys，其中 Ae = λ²/(4π) · 10^(G/10)，λ = c/f。',
    'efficiency.frequency': '频率',
    'efficiency.gain': '天线增益 (dBi)',
    'efficiency.area': '天线实物面积',
    'efficiency.result.wavelength': '波长 λ',
    'efficiency.result.effective_area': '有效口径面积 Ae',
    'efficiency.result.efficiency': '口径效率 η',
    'efficiency.warning.over_unity': '计算效率超过 100%，输入物理不一致，请复核增益或面积。',
    'efficiency.errors.frequency_not_positive': '频率必须大于 0。',
    'efficiency.errors.area_not_positive': '口径面积必须大于 0。',
    'efficiency.errors.gain_not_finite': '增益必须为有限数值。',

    'wavelength.heading': '波长计算',
    'wavelength.description':
      'λ₀ = c/f，均匀介质中 TEM 波 λg = λ₀/√εᵣ，并给出 λg/2、λg/4 和相速度。',
    'wavelength.frequency': '频率',
    'wavelength.dielectric': '相对介电常数 εᵣ',
    'wavelength.result.lambda0': '自由空间波长 λ₀',
    'wavelength.result.lambdag': '介质内波长 λg',
    'wavelength.result.half': '半波长 λg/2',
    'wavelength.result.quarter': '四分之一波长 λg/4',
    'wavelength.result.phase_velocity': '相速度 vₚ',
    'wavelength.errors.frequency_not_positive': '频率必须大于 0。',
    'wavelength.errors.er_less_than_one': '相对介电常数必须 ≥ 1。',

    'transmission.heading': '传输线特性阻抗',
    'transmission.description':
      '计算特性阻抗 Z₀、有效介电常数 εeff 和相速度。微带线采用 Hammerstad–Jensen 模型；同轴线采用 Z₀ = 60/√εᵣ · ln(D/d)。',
    'transmission.type': '传输线类型',
    'transmission.type.microstrip': '微带线',
    'transmission.type.coaxial': '同轴线',
    'transmission.microstrip.width': '导带宽度 W',
    'transmission.microstrip.height': '基板厚度 h',
    'transmission.coaxial.inner': '内导体直径 d',
    'transmission.coaxial.outer': '外导体内径 D',
    'transmission.dielectric': '相对介电常数 εᵣ',
    'transmission.result.z0': '特性阻抗 Z₀',
    'transmission.result.eeff': '有效介电常数 εeff',
    'transmission.result.vp': '相速度 vₚ',
    'transmission.warning.range':
      'W/h 超出 Hammerstad–Jensen 模型的有效范围（0.01 – 100），结果可能不准确。',
    'transmission.errors.width_not_positive': '导带宽度必须大于 0。',
    'transmission.errors.height_not_positive': '基板厚度必须大于 0。',
    'transmission.errors.inner_not_positive': '内导体直径必须大于 0。',
    'transmission.errors.outer_not_greater_than_inner': '外导体内径必须大于内导体直径。',
    'transmission.errors.er_less_than_one': '相对介电常数必须 ≥ 1。',

    'siw.heading': 'SIW 通孔设计',
    'siw.description':
      '按 Deslandes & Wu 设计规则：d ≈ λd/10，p = 1.5·d，等效宽度 aeff = a − d²/(0.95·p)，TE₁₀ 截止频率 fc = c/(2·aeff·√εᵣ)。',
    'siw.frequency': '工作频率',
    'siw.dielectric': '相对介电常数 εᵣ',
    'siw.width': '通孔中心间波导宽度 a',
    'siw.result.diameter': '推荐通孔直径 d',
    'siw.result.pitch': '推荐通孔间距 p',
    'siw.result.effective_width': '等效宽度 aeff',
    'siw.result.cutoff': '截止频率 fc',
    'siw.warning.below_cutoff': '工作频率不高于 TE₁₀ 截止频率，波无法传播，请增大宽度 a。',
    'siw.errors.frequency_not_positive': '频率必须大于 0。',
    'siw.errors.er_less_than_one': '相对介电常数必须 ≥ 1。',
    'siw.errors.width_not_positive': '宽度必须大于 0。',
    'siw.errors.width_too_small_for_vias': '该频率下推荐通孔尺寸过大，宽度 a 不足。',

    'tbd.placeholder': '更多计算功能即将推出。',

    'verify.button': '用 Python 验证',
    'verify.checking': '验证中…',
    'verify.match': 'Python 一致（误差小于 10⁻⁹）',
    'verify.mismatch': '与 Python 参考实现不一致',
    'verify.unavailable': '当前环境无 Python 可用',
    'verify.error': '验证失败',
  },
} as const

export type Language = keyof typeof strings
export type TranslationKey = keyof (typeof strings)['en']
