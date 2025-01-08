document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active-tab'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active-tab');
        });
    });

    // 默认激活第一个标签页
    tabs[0].classList.add('active');
    contents[0].classList.add('active-tab');

    const minFrequencyInput = document.getElementById('min-frequency');
    const maxFrequencyInput = document.getElementById('max-frequency');
    const resultDiv = document.getElementById('bandwidth-result');

    function calculateBandwidth() {
        const minFrequency = parseFloat(minFrequencyInput.value);
        const maxFrequency = parseFloat(maxFrequencyInput.value);

        if (!isNaN(minFrequency) && !isNaN(maxFrequency) && minFrequency > 0 && maxFrequency > minFrequency) {
        // Calculate the relative bandwidth
        const relativeBandwidth = ((maxFrequency - minFrequency) / ((maxFrequency + minFrequency) / 2)) * 100;

        // Calculate the absolute bandwidth
        const absoluteBandwidth = maxFrequency - minFrequency;

        // Display the results
        resultDiv.innerHTML = `相对带宽: ${relativeBandwidth.toFixed(2)}%<br>绝对带宽: ${absoluteBandwidth.toFixed(2)} Hz`;
        } else {
            resultDiv.innerHTML = '请输入有效的频率值';
        }
    }

function calculateApertureEfficiency() {
    const frequencyInput = document.getElementById('frequency');
    const antennaGainInput = document.getElementById('antenna-gain');
    const antennaAreaInput = document.getElementById('antenna-area');
    const efficiencyResultDiv = document.getElementById('efficiency-result');

    const frequency = parseFloat(frequencyInput.value);
    const antennaGain = parseFloat(antennaGainInput.value);
    const antennaArea = parseFloat(antennaAreaInput.value);

    if (!isNaN(frequency) && !isNaN(antennaGain) && !isNaN(antennaArea) && frequency > 0 && antennaArea > 0) {
        // Speed of light in meters per second
        const speedOfLight = 299792458;

        // Calculate k0
        const k0 = speedOfLight / frequency;

        // Calculate a0
        const a0 = (Math.pow(k0, 2) / (4 * Math.PI)) * Math.pow(10, antennaGain / 10);

        // Calculate aperture efficiency
        const apertureEfficiency = (a0 / antennaArea) * 100;

        // Display the result
        efficiencyResultDiv.innerHTML = `口径效率: ${apertureEfficiency.toFixed(2)}%`;
    } else {
        efficiencyResultDiv.innerHTML = '请输入有效的频率、天线增益和天线面积值';
    }
}

// Add event listener to the calculate button
document.getElementById('calculate-efficiency').addEventListener('click', calculateApertureEfficiency);


    minFrequencyInput.addEventListener('input', calculateBandwidth);
    maxFrequencyInput.addEventListener('input', calculateBandwidth);
});

function switchLanguage(language) {
    const tabContents = {
        'bandwidth': {
            'en': `
                <label for="min-frequency">Min Frequency (Hz):</label>
                <input type="number" id="min-frequency" name="min-frequency">
                <br>
                <label for="max-frequency">Max Frequency (Hz):</label>
                <input type="number" id="max-frequency" name="max-frequency">
                <br>
                <div id="bandwidth-result"></div>
            `,
            'zh': `
                <label for="min-frequency">最低工作频率 (Hz):</label>
                <input type="number" id="min-frequency" name="min-frequency">
                <br>
                <label for="max-frequency">最高工作频率 (Hz):</label>
                <input type="number" id="max-frequency" name="max-frequency">
                <br>
                <div id="bandwidth-result"></div>
            `
        },
        'efficiency': {
            'en': `
                <label for="frequency">Frequency (Hz):</label>
                <input type="number" id="frequency" name="frequency">
                <br>
                <label for="antenna-gain">Antenna Gain (dBi):</label>
                <input type="number" id="antenna-gain" name="antenna-gain">
                <br>
                <label for="antenna-area">Antenna Area (m²):</label>
                <input type="number" id="antenna-area" name="antenna-area">
                <br>
                <button id="calculate-efficiency">Calculate Aperture Efficiency</button>
                <br>
                <div id="efficiency-result"></div>
            `,
            'zh': `
                <label for="frequency">频率 (Hz):</label>
                <input type="number" id="frequency" name="frequency">
                <br>
                <label for="antenna-gain">天线增益 (dBi):</label>
                <input type="number" id="antenna-gain" name="antenna-gain">
                <br>
                <label for="antenna-area">天线面积 (m²):</label>
                <input type="number" id="antenna-area" name="antenna-area">
                <br>
                <button id="calculate-efficiency">计算口径效率</button>
                <br>
                <div id="efficiency-result"></div>
            `
        },
        'tbd': {
            'en': 'TBD - Feature to be implemented',
            'zh': 'TBD - 待实现的功能'
        }
    };

    const tabNames = {
        'bandwidth': {
            'en': 'Relative Bandwidth',
            'zh': '相对带宽'
        },
        'efficiency': {
            'en': 'Aperture Efficiency',
            'zh': '口径效率'
        },
        'tbd': {
            'en': 'TBD',
            'zh': 'TBD'
        }
    };

    for (const [key, value] of Object.entries(tabContents)) {
        document.getElementById(key).innerHTML = value[language];
    }

    for (const [key, value] of Object.entries(tabNames)) {
        document.querySelector(`.tab[data-tab="${key}"]`).innerText = value[language];
    }
}

window.switchLanguage = switchLanguage;