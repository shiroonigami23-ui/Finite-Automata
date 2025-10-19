import { MACHINE, setMachine, pushUndo } from './state.js';
import { renderAll } from './renderer.js';
import { setValidationMessage } from './utils.js';

function findShortestAcceptedStrings(machine) {
    const queue = [];
    const visited = new Set();
    const accepted = [];
    const initialStates = machine.states.filter(s => s.initial);
    if (initialStates.length === 0) return [];
    if (initialStates.some(s => s.accepting)) accepted.push("ε");
    for (const startState of initialStates) {
        queue.push({ state: startState.id, path: "" });
        visited.add(startState.id + ",");
    }
    let head = 0;
    while (head < queue.length && accepted.length < 5) {
        const { state, path } = queue[head++];
        if (path.length > 10) continue;
        const transitions = machine.transitions.filter(t => t.from === state);
        for (const t of transitions) {
            const newPath = path + (t.symbol || '');
            const visitedKey = t.to + "," + newPath;
            if (!visited.has(visitedKey)) {
                visited.add(visitedKey);
                const nextState = machine.states.find(s => s.id === t.to);
                if (nextState) {
                    if (nextState.accepting && !accepted.includes(newPath)) {
                        accepted.push(newPath);
                    }
                    queue.push({ state: t.to, path: newPath });
                }
            }
        }
    }
    return accepted.sort((a, b) => a.length - b.length).slice(0, 3);
}


export function saveMachine() {
    const modal = document.getElementById('saveLibraryModal');
    const descInput = document.getElementById('libDescInput');
    const alphabetDisplay = document.getElementById('libAlphabetDisplay');
    if (!modal || !descInput || !alphabetDisplay) return;

    const machineType = MACHINE.type || 'DFA';
    const shortestStrings = findShortestAcceptedStrings(MACHINE);
    const alphabet = [...new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s != null && s !== ''))].sort();

    let autoTitle;
    if (shortestStrings.length > 0) {
        const examples = shortestStrings.map(s => `"${s}"`).join(', ');
        autoTitle = `${machineType} that accepts ${examples}, ...`;
    } else if (MACHINE.states.some(s => s.accepting)) {
        autoTitle = `${machineType} with an unreachable language`;
    } else {
        autoTitle = `${machineType} that accepts nothing (empty language)`;
    }
    
    descInput.value = `Accepts short strings such as: ${shortestStrings.join(', ') || 'none'}.`;

    if (machineType === 'DFA') {
        alphabetDisplay.innerHTML = `<strong>Formal Alphabet (auto-detected):</strong> {${alphabet.join(', ') || '∅'}}`;
        alphabetDisplay.style.display = 'block';
    } else {
        alphabetDisplay.style.display = 'none';
    }

    document.getElementById('libTitleInput').value = autoTitle;
    document.getElementById('libTypeInput').value = machineType;
    modal.style.display = 'flex';
}

export function handleSaveWithMetadata() {
    const title = document.getElementById('libTitleInput').value.trim();
    const userDescription = document.getElementById('libDescInput').value.trim();
    const type = document.getElementById('libTypeInput').value;

    if (!title) {
        window.customAlert("Input Required", "Please enter a title for the library entry.");
        return;
    }
    
    const alphabet = [...new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s != null && s !== ''))].sort();
    let finalDescription = userDescription;

    if (type === 'DFA') {
        const alphabetString = `The formal alphabet is {${alphabet.join(', ') || '∅'}}.`;
        finalDescription = userDescription ? `${userDescription} ${alphabetString}` : alphabetString;
    }

    const libraryEntry = {
        title: title,
        description: finalDescription,
        type: type,
        machine: { ...MACHINE, type: type, alphabet: alphabet }
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
                MACHINE.type = machineType;
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
