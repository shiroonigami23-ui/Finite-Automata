import { MACHINE, setMachine, pushUndo } from './state.js';
import { renderAll } from './renderer.js';
import { setValidationMessage } from './utils.js';

// --- UPGRADED: This function now analyzes the machine and auto-generates details ---
export function saveMachine() {
    const modal = document.getElementById('saveLibraryModal');
    if (!modal) return;

    // 1. Analyze the current machine
    const machineType = MACHINE.type || 'DFA';
    const stateCount = MACHINE.states.length;
    const acceptingStates = MACHINE.states.filter(s => s.accepting);
    const initialStates = MACHINE.states.filter(s => s.initial);
    const alphabet = [...new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s))].sort();

    // 2. Auto-generate a title
    const autoTitle = `${machineType} with ${stateCount} state${stateCount === 1 ? '' : 's'}`;
    
    // 3. Auto-generate a detailed description
    let autoDesc = `A ${machineType} with ${stateCount} state(s) (${MACHINE.states.map(s => s.id).join(', ')}). `;
    autoDesc += `It has ${initialStates.length} initial state(s) (${initialStates.map(s => s.id).join(', ') || 'none'}) `;
    autoDesc += `and ${acceptingStates.length} accepting state(s) (${acceptingStates.map(s => s.id).join(', ') || 'none'}). `;
    autoDesc += `The alphabet is {${alphabet.join(', ') || '∅'}}.`;

    // 4. Populate and show the modal
    document.getElementById('libTitleInput').value = autoTitle;
    document.getElementById('libDescInput').value = autoDesc;
    document.getElementById('libTypeInput').value = machineType;
    modal.style.display = 'flex';
}

// This function is called by the modal to perform the save
export function handleSaveWithMetadata() {
    const title = document.getElementById('libTitleInput').value.trim();
    const description = document.getElementById('libDescInput').value.trim();
    const type = document.getElementById('libTypeInput').value;

    if (!title) {
        // Using a custom alert now to match the app's UI
        const customAlert = window.customAlert || alert;
        customAlert("Input Required", "Please enter a title for the library entry.");
        return;
    }

    // Create a library-ready object
    const libraryEntry = {
        title: title,
        description: description,
        type: type,
        machine: { ...MACHINE, type: type, alphabet: [...new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s))] }
    };

    const blob = new Blob([JSON.stringify(libraryEntry, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50) || 'automaton'}.json`;
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);

    const modal = document.getElementById('saveLibraryModal');
    if (modal) modal.style.display = 'none';
}


export function loadMachine(e, updateUIFunction) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            const machineData = data.machine || data;

            if (machineData.states && machineData.transitions) {
                pushUndo(updateUIFunction);
                const machineType = machineData.type || data.type || 'DFA';
                setMachine(machineData);
                document.getElementById('modeSelect').value = machineType;
                MACHINE.type = machineType; // Ensure global state is also updated
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

    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .state-circle { fill: #fff; stroke: #667eea; stroke-width: 3; }
        .state-label { font-family: Inter, sans-serif; font-weight: 700; fill: #0b1220; text-anchor: middle; dominant-baseline: central; font-size: 14px; }
        .transition-path { fill: none; stroke: #667eea; stroke-width: 2; marker-end: url(#arrowhead); }
        .initial-arrow { stroke: black !important; stroke-width: 3 !important; marker-end: url(#arrowhead); }
        .initial-pulse { animation: pulseInitialState 2.5s infinite ease-in-out; }
        .final-ring { fill: none; stroke: #ff9800; stroke-width: 4; }
        .transition-label-text {
          stroke: white;
          stroke-width: 4px;
          stroke-linejoin: round;
          fill: none;
          font-family: Inter, sans-serif; text-anchor: middle; font-size: 13px; font-weight: 700;
        }
        .transition-label {
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
