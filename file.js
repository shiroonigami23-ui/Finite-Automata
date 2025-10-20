import { MACHINE, setMachine, pushUndo } from './state.js';
import { renderAll, layoutStatesCircular } from './renderer.js';
import { setValidationMessage } from './utils.js';
// NEW: Import the animation function to use it for loading/importing
import { animateMachineDrawing } from './animation.js';

// --- Machine Analysis Helpers for Smart Save ---

/**
 * Finds the shortest path from the initial state to the first accepting state.
 * @param {object} machine The automaton to analyze.
 * @param {number} minLength The minimum length of the path to find.
 * @returns {string|null} The shortest accepted string or null.
 */
function findShortestAcceptedStrings(machine, minLength = 0) {
    const queue = [];
    const visited = new Set();
    const initialStates = machine.states.filter(s => s.initial);
    if (initialStates.length === 0) return null;

    for (const startState of initialStates) {
        if (startState.accepting && minLength === 0) return "ε";
        queue.push({ stateId: startState.id, path: "" });
        visited.add(startState.id);
    }

    let head = 0;
    while (head < queue.length) {
        const { stateId, path } = queue[head++];
        if (path.length > 5) continue; // Performance guard

        const outgoing = machine.transitions.filter(t => t.from === stateId);
        for (const t of outgoing) {
            if (!t.symbol) continue; // Ignore epsilon transitions for this analysis
            const newPath = path + t.symbol;
            const nextState = machine.states.find(s => s.id === t.to);

            if (nextState && nextState.accepting && newPath.length >= minLength) {
                return newPath; // Found the shortest valid path
            }

            const visitedKey = t.to + "," + newPath;
            if (nextState && !visited.has(visitedKey)) {
                visited.add(visitedKey);
                queue.push({ stateId: t.to, path: newPath });
            }
        }
    }
    return null;
}

/**
 * Finds the shortest path from the initial state to a specific target state.
 * @param {object} machine The automaton to analyze.
 * @param {string} targetStateId The ID of the state to find a path to.
 * @returns {string|null} The shortest path string or null.
 */
function findShortestPathToState(machine, targetStateId) {
    const queue = [];
    const visited = new Set();
    const initialStates = machine.states.filter(s => s.initial);
    if (initialStates.length === 0) return null;

    for (const startState of initialStates) {
        if (startState.id === targetStateId) return "";
        queue.push({ stateId: startState.id, path: "" });
        visited.add(startState.id);
    }

    let head = 0;
    while (head < queue.length) {
        const { stateId, path } = queue[head++];
        if (path.length > 5) continue;

        const outgoing = machine.transitions.filter(t => t.from === stateId);
        for (const t of outgoing) {
             if (!t.symbol) continue;
            const newPath = path + t.symbol;
            if (t.to === targetStateId) {
                return newPath;
            }

            const visitedKey = t.to + "," + newPath;
            if (!visited.has(visitedKey)) {
                visited.add(visitedKey);
                queue.push({ stateId: t.to, path: newPath });
            }
        }
    }
    return null;
}


/**
 * Analyzes the machine's structure to guess its purpose (e.g., "starts with", "ends with").
 * @param {object} machine The automaton to analyze.
 * @returns {string|null} A descriptive title or null if no pattern is found.
 */
function analyzeMachineStructure(machine) {
    const { states, transitions } = machine;
    if (states.length === 0) return null;

    const alphabet = [...new Set(transitions.map(t => t.symbol).filter(s => s != null && s !== ''))].sort();
    if (alphabet.length === 0) return null;

    const initialState = states.find(s => s.initial);
    if (!initialState) return null;

    // --- Helper to find trap states ---
    const trapStates = new Set(states.filter(s => {
        if (s.accepting) return false;
        const outgoing = transitions.filter(t => t.from === s.id);
        return alphabet.every(symbol => {
            const transForSymbol = outgoing.filter(t => t.symbol === symbol);
            return transForSymbol.length > 0 && transForSymbol.every(t => t.to === s.id);
        });
    }).map(s => s.id));

    // --- Heuristic 1: Starts With ---
    const initialTransitions = transitions.filter(t => t.from === initialState.id);
    const pathsToTrap = initialTransitions.filter(t => trapStates.has(t.to));
    if (pathsToTrap.length > 0 && pathsToTrap.length < initialTransitions.length) {
        const path = findShortestPathToAccept(machine, 1);
        if (path) return `Starts with '${path}'`;
    }

    // --- Heuristic 2: Contains Substring ---
    const acceptingSinks = states.filter(s => {
        if (!s.accepting) return false;
        const outgoing = transitions.filter(t => t.from === s.id);
        return alphabet.every(symbol => {
            const transForSymbol = outgoing.filter(t => t.symbol === symbol);
            return transForSymbol.length > 0 && transForSymbol.every(t => t.to === s.id);
        });
    });
    if (acceptingSinks.length > 0) {
        const path = findShortestPathToState(machine, acceptingSinks[0].id);
        if (path) return `Contains substring '${path}'`;
    }

    // --- Heuristic 3: Ends With ---
    const acceptingStates = states.filter(s => s.accepting);
    if (acceptingStates.length > 0 && !acceptingStates.every(s => acceptingSinks.some(as => as.id === s.id))) {
       const path = findShortestPathToAccept(machine, 1);
       if(path) return `Ends with '${path}'`;
    }

    return null; // No specific pattern found
}


export function saveMachine() {
    const modal = document.getElementById('saveLibraryModal');
    const descInput = document.getElementById('libDescInput');
    const alphabetDisplay = document.getElementById('libAlphabetDisplay');
    if (!modal || !descInput || !alphabetDisplay) return;

    const machineType = MACHINE.type || 'DFA';

    // --- NEW: Smart Title Generation ---
    let autoTitle = analyzeMachineStructure(MACHINE);
    
    // Fallback to the old logic if analysis returns nothing
    if (!autoTitle) {
        const shortestStrings = findShortestAcceptedStrings(MACHINE);
        if (shortestStrings.length > 0 && shortestStrings[0] !== "ε") {
            const examples = shortestStrings.map(s => `"${s}"`).join(', ');
            autoTitle = `Accepts ${examples}, ...`;
        } else if (shortestStrings.length > 0) {
             autoTitle = `Accepts ε and other strings`;
        } else if (MACHINE.states.some(s => s.accepting)) {
            autoTitle = `Has an unreachable language`;
        } else {
            autoTitle = `Accepts nothing (empty language)`;
        }
    }
    
    // Prepend the machine type to the generated title
    const finalTitle = `${machineType}: ${autoTitle}`;
    document.getElementById('libTitleInput').value = finalTitle;
    
    // --- End of New Logic ---

    const alphabet = [...new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s != null && s !== ''))].sort();
    
    descInput.value = `Accepts short strings such as: ${findShortestAcceptedStrings(MACHINE).join(', ') || 'none'}.`;

    if (machineType === 'DFA') {
        alphabetDisplay.innerHTML = `<strong>Formal Alphabet (auto-detected):</strong> {${alphabet.join(', ') || '∅'}}`;
        alphabetDisplay.style.display = 'block';
    } else {
        alphabetDisplay.style.display = 'none';
    }

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


/**
 * MODIFIED: This function now uses the drawing animation.
 */
export function loadMachine(e, updateUIFunction) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            const machineData = data.machine || data; // Handles both file formats

            if (machineData.states && machineData.transitions) {
                pushUndo(updateUIFunction);
                const machineType = machineData.type || data.type || 'DFA';
                document.getElementById('modeSelect').value = machineType;
                
                // Construct the full machine object to be animated
                const machineToAnimate = {
                    ...machineData,
                    type: machineType
                };

                // CHANGE: Instead of setting the machine directly, we animate it
                animateMachineDrawing(machineToAnimate);
                
            } else {
                setValidationMessage("Invalid machine file format.", 'error');
            }
        } catch (err) {
            setValidationMessage("Invalid JSON file: " + err.message, 'error');
        } finally {
            // Clear input to allow re-uploading the same file
            e.target.value = '';
        }
    };
    reader.readAsText(file);
}

export function exportPng(fileName = 'automaton') {
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
        const finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
        a.download = finalFileName;
        a.href = canvas.toDataURL("image/png");
        a.click();
    };

    img.src = url;
}


/**
 * MODIFIED: This function now uses the drawing animation after getting the AI result.
 */
export async function handleImageUpload(e, updateUIFunction, showLoading, hideLoading) {
    const file = e.target.files[0];
    if (!file) return;

    showLoading();

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64ImageData = reader.result.split(',')[1];
        
        try {
            const prompt = `
                You are an expert in automata theory. Analyze the provided image of a finite automaton.
                Extract all states and transitions and return them as a valid JSON object.
                - The JSON object must have two keys: "states" and "transitions".
                - "states" is an array of objects, each with: "id" (string), "initial" (boolean), "accepting" (boolean). You can ignore x/y coordinates.
                - "transitions" is an array of objects, each with: "from" (string, the source state id), "to" (string, the destination state id), and "symbol" (string).
                - An incoming arrow with no source indicates an initial state.
                - A double circle indicates an accepting (final) state.
                - For epsilon transitions, use an empty string "" for the symbol.
                - Ensure the state IDs in the transitions array perfectly match the state IDs in the states array.
                - Do not include any extra text or explanations outside of the JSON object.
            `;

            const apiKey = "AIzaSyAJiWZMJlcZAsPzEo8vW35KFH6Yuk8enjc";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: file.type, data: base64ImageData } }
                    ]
                }]
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text;
            
            const jsonString = text.match(/```json\n([\s\S]*?)\n```/)[1];
            const parsedJson = JSON.parse(jsonString);

            if (parsedJson.states && parsedJson.transitions) {
                pushUndo(updateUIFunction);
                
                // First, add coordinates to the states since the AI doesn't provide them
                layoutStatesCircular(parsedJson.states); 
                
                const machineToAnimate = {
                    type: 'DFA', // Default to DFA, user can change mode later
                    ...parsedJson,
                    alphabet: [...new Set(parsedJson.transitions.map(t => t.symbol).filter(s => s))]
                };
                
                document.getElementById('modeSelect').value = 'DFA';

                // Animate the newly created machine
                animateMachineDrawing(machineToAnimate);
                
                // The success alert is now removed, as requested.
                
            } else {
                throw new Error("Response did not contain valid 'states' or 'transitions'.");
            }

        } catch (error) {
            console.error("Error during image processing:", error);
            window.customAlert('Import Failed', 'Sorry, I could not understand the image or the format was invalid. Please try a clearer image.');
        } finally {
            hideLoading();
            e.target.value = ''; 
        }
    };
    reader.onerror = error => {
        console.error("Error reading file:", error);
        window.customAlert('File Error', 'Could not read the selected image file. Please try another.');
        hideLoading();
    };
}
