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

/**
 * Exports the current SVG canvas to a high-resolution PNG file.
 */
export function exportPng() {
    const svgEl = document.getElementById("dfaSVG");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const bbox = svgEl.getBBox();
    const padding = 20;
    const width = bbox.width + (padding * 2);
    const height = bbox.height + (padding * 2);

    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const svgClone = svgEl.cloneNode(true);
    
    svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);

    // --- FIX FOR PNG EXPORT STYLING ---
    // This style block now correctly mirrors the robust styling from the main CSS file.
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* General Styles */
        .state-circle { fill: #fff; stroke: #667eea; stroke-width: 3; }
        .state-label { font-family: Inter, sans-serif; font-weight: 700; fill: #0b1220; text-anchor: middle; dominant-baseline: central; font-size: 14px; }
        .transition-path { fill: none; stroke: #667eea; stroke-width: 2; marker-end: url(#arrowhead); }
        .initial-arrow { stroke: black !important; stroke-width: 3 !important; marker-end: url(#arrowhead); }
        .final-ring { fill: none; stroke: #ff9800; stroke-width: 4; }

        /* Correct Halo + Text Styling for Export */
        .transition-label-text { /* Halo */
          stroke: white;
          stroke-width: 4px;
          stroke-linejoin: round;
          fill: none;
          font-family: Inter, sans-serif; text-anchor: middle; font-size: 13px; font-weight: 700;
        }
        .transition-label { /* Text */
          font-family: Inter, sans-serif;
          font-weight: 700;
          fill: #0b1220;
          text-anchor: middle;
          font-size: 13px;
        }
    `;
    svgClone.querySelector('defs').appendChild(styleEl);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        URL.revokeObjectURL(url);

        const a = document.createElement("a");
        a.download = "automaton.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    };

    img.src = url;
}
