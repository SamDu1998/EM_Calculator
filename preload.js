const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    calculateBandwidth: (minFrequency, maxFrequency) => ipcRenderer.invoke('calculate-bandwidth', minFrequency, maxFrequency)
});

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    replaceText('author', 'Author: Sam; Version: 20250107');
});