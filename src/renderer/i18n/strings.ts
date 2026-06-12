export const strings = {
  en: {
    'app.title': 'EM Calculator',
    'app.subtitle': 'Electromagnetic engineering quantities',
    'app.author': 'Author: Sam · Version 0.2',

    'tabs.bandwidth': 'Relative Bandwidth',
    'tabs.efficiency': 'Aperture Efficiency',
    'tabs.wavelength': 'Wavelength',
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
