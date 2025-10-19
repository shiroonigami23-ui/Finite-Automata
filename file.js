import { MACHINE, setMachine, pushUndo } from './state.js';
import { renderAll } from './renderer.js';
import { setValidationMessage } from './utils.js';

export function saveMachine() {
    const blob = new Blob([JSON.stringify(MACHINE, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "machine.json";
    a.click();
    URL.revokeObjectURL(a.href);
}

export function loadMachine(e, updateUIFunction) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.states && data.transitions) {
                pushUndo(updateUIFunction);
                setMachine(data);
                if (!data.type) data.type = 'DFA';
                document.getElementById('modeSelect').value = data.type;
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

    const svgClone = svgEl.cloneNode(true);
    const bbox = svgEl.getBBox();
    const width = bbox.width + 40;
    const height = bbox.height + 40;
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);

    // Apply basic styles for export
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .state-circle { fill: #fff; stroke: #667eea; stroke-width: 3; }
        .state-label { font-weight: 700; fill: #0b1220; text-anchor: middle; dominant-baseline: central; font-size: 14px; }
        .transition-path { fill: none; stroke: #667eea; stroke-width: 2; marker-end: url(#arrowhead); }
        .transition-label { font-weight: 700; fill: #0b1220; text-anchor: middle; font-size: 13px; }
        .initial-arrow { stroke: black !important; stroke-width: 3 !important; marker-end: url(#arrowhead); }
        .final-ring { fill: none; stroke: #ff9800; stroke-width: 4; }
    `;
    svgClone.querySelector('defs').appendChild(styleEl);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const a = document.createElement("a");
        a.download = "automaton.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    };
    img.src = url;
}
