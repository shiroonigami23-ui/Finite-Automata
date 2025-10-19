import { MACHINE, pushUndo } from './state.js';
import { renderAll } from './renderer.js';

export function saveMachine() {
    const blob = new Blob([JSON.stringify(MACHINE, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "machine.json";
    a.click();
    URL.revokeObjectURL(a.href);
}

export function loadMachine(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.states && data.transitions) {
                pushUndo();
                MACHINE = data;
                if (!MACHINE.type) MACHINE.type = 'DFA';
                renderAll();
            } else {
                setValidationMessage("Invalid machine file format.", 'error');
            }
        } catch (err) {
            setValidationMessage("Invalid JSON file: " + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

export function exportPng() {
    const svgEl = document.getElementById("dfaSVG");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const cssStyles = `
        .state-circle { fill: #fff; stroke: #667eea; stroke-width: 3; }
        .state-label { font-weight: 700; fill: #0b1220; text-anchor: middle; dominant-baseline: central; font-size: 14px; }
        .transition-path { fill: none; stroke: #667eea; stroke-width: 2; marker-end: url(#arrowhead-export); }
        .transition-label { font-weight: 700; fill: #0b1220; text-anchor: middle; font-size: 13px; }
        .initial-arrow { stroke: black !important; stroke-width: 3 !important; marker-end: url(#arrowhead-export); }
        .final-ring { fill: none; stroke: #ff9800; stroke-width: 4; }
    `;

    const svgClone = svgEl.cloneNode(true);
    
    const styleEl = document.createElement('style');
    styleEl.textContent = cssStyles;
    
    svgClone.querySelector('defs').appendChild(styleEl);

    svgClone.querySelector('#arrowhead').setAttribute('fill', '#667eea');
    svgClone.querySelector('#arrowhead-export').setAttribute('fill', '#667eea');

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        canvas.width = svgEl.viewBox.baseVal.width;
        canvas.height = svgEl.viewBox.baseVal.height;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const a = document.createElement("a");
        a.download = "automaton.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    };

    img.onerror = () => {
        console.error("Image loading failed. The SVG might be tainted.");
        URL.revokeObjectURL(url);
    };

    img.src = url;
}
