import { pushUndo, setMachine } from './state.js';
import { renderAll } from './renderer.js';
import { setValidationMessage } from './utils.js';

export function saveMachine() {
    // Access MACHINE via a function to ensure it's up-to-date
    const getMachine = () => import('./state.js').then(m => m.MACHINE);
    getMachine().then(MACHINE => {
        const blob = new Blob([JSON.stringify(MACHINE, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "machine.json";
        a.click();
        URL.revokeObjectURL(a.href);
    });
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

    // Clone the SVG to avoid modifying the original
    const svgClone = svgEl.cloneNode(true);
    // Explicitly set dimensions for rasterization
    const bbox = svgEl.getBBox();
    const width = bbox.width + 20; // Add some padding
    const height = bbox.height + 20;
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);


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
