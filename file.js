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

    // --- FIX FOR BLURRINESS & OVERLAPPING ---

    // 1. Get the exact bounding box of the SVG content to crop the image correctly.
    const bbox = svgEl.getBBox();
    const padding = 20; // Add some padding around the automaton
    const width = bbox.width + (padding * 2);
    const height = bbox.height + (padding * 2);

    // 2. Increase resolution by scaling the canvas. A scale of 2 is good for most screens.
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    // 3. Clone the SVG to avoid modifying the live version.
    const svgClone = svgEl.cloneNode(true);
    
    // Adjust the viewBox of the clone to match the content's bounding box.
    svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);

    // 4. Inject a comprehensive style block to ensure the export looks like the canvas.
    // This is crucial for text rendering (like the halo) and correct colors.
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* General Styles */
        .state-circle { fill: #fff; stroke: #667eea; stroke-width: 3; }
        .state-label { font-family: Inter, sans-serif; font-weight: 700; fill: #0b1220; text-anchor: middle; dominant-baseline: central; font-size: 14px; }
        .transition-path { fill: none; stroke: #667eea; stroke-width: 2; marker-end: url(#arrowhead); }
        
        /* Transition Label Halo (prevents overlap) */
        .transition-label-text {
            font-family: Inter, sans-serif;
            stroke: white;
            stroke-width: 4px;
            stroke-linejoin: round;
            text-anchor: middle;
            font-size: 13px;
            font-weight: 700;
            fill: #0b1220;
        }
        .transition-label { display: none; } /* Hide the original thin label, we only want the halo version */

        /* Special States */
        .initial-arrow { stroke: black !important; stroke-width: 3 !important; marker-end: url(#arrowhead); }
        .final-ring { fill: none; stroke: #ff9800; stroke-width: 4; }
    `;
    svgClone.querySelector('defs').appendChild(styleEl);

    // 5. Convert the styled SVG clone to a data URL.
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        // 6. Draw the image onto the high-resolution canvas.
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply the scale transform before drawing
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        URL.revokeObjectURL(url);

        // 7. Trigger the download.
        const a = document.createElement("a");
        a.download = "automaton.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    };

    img.src = url;
}
