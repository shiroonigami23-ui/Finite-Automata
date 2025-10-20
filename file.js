import { MACHINE, setMachine, pushUndo } from './state.js';
import { renderAll, layoutStatesCircular } from './renderer.js';
import { setValidationMessage } from './utils.js';
import { animateMachineDrawing } from './animation.js'; // Ensure this is imported

// --- Functions for the "Smart Save" feature ---
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

    // Simulate loading state for consistency if you add a universal loading indicator
    // showLoading("Your machine is being loaded..."); 

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            const machineData = data.machine || data;

            if (machineData.states && machineData.transitions) {
                pushUndo(updateUIFunction);
                const machineType = machineData.type || data.type || 'DFA';
                
                const machineToAnimate = {
                    ...machineData,
                    type: machineType
                };
                
                document.getElementById('modeSelect').value = machineType;
                // Pass the machineType to animateMachineDrawing
                animateMachineDrawing(machineToAnimate, machineType); 

            } else {
                setValidationMessage("Invalid machine file format.", 'error');
            }
        } catch (err) {
            setValidationMessage("Invalid JSON file: " + err.message, 'error');
        } finally {
            e.target.value = '';
            // hideLoading(); // If you implement a universal loading indicator
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


// --- NEW: AI Image Import Logic ---
export async function handleImageUpload(e, updateUIFunction, showLoading, hideLoading) {
    const file = e.target.files[0];
    if (!file) return;

    showLoading("Your image is being loaded..."); // Changed message

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64ImageData = reader.result.split(',')[1];
        
        try {
            // --- UPDATED, SMARTER PROMPT ---
            const prompt = `
                You are a meticulous expert in automata theory, specializing in converting visual diagrams into structured data. Your task is to analyze the provided image of a finite automaton and extract its components with extreme precision.

                **Primary Directive:** Your output MUST be a single, valid JSON object with two top-level keys: "machine" and "detectedType". There should be no surrounding text or explanations outside this JSON.

                **Step-by-Step Analysis Guide for "machine" object:**
                1.  **Identify all States:** Locate every circle, which represents a state. Note its name (e.g., 'q0', 'A', etc.).
                2.  **Determine State Properties:**
                    * **Initial State:** Look for a state with an incoming arrow that has no source state. This is the initial state. Set its "initial" property to \`true\`.
                    * **Accepting States:** Identify any states drawn with a double circle. These are accepting (or final) states. Set their "accepting" property to \`true\`.
                3.  **Analyze all Transitions (This is the most critical step):**
                    * For every line connecting two states, you MUST carefully identify the arrowhead.
                    * The state the **arrowhead points directly to** is the **destination (\`to\`) state**.
                    * The state where the line **originates from** is the **source (\`from\`) state**.
                    * For curved lines or loops, the direction is still determined solely by the arrowhead's position.
                    * A transition that starts and ends at the same state is a self-loop. The "from" and "to" properties will be the same for this transition.
                    * Identify the symbol(s) written near the transition line. For epsilon (ε) transitions, use an empty string "" for the "symbol".

                **Step-by-Step Analysis Guide for "detectedType" string:**
                After extracting the states and transitions, determine the most precise type of automaton:
                -   **DFA (Deterministic Finite Automaton):**
                    -   Must have exactly one initial state.
                    -   For every state and every symbol in the alphabet, there must be *exactly one* outgoing transition.
                    -   No epsilon (empty string) transitions.
                -   **NFA (Non-deterministic Finite Automaton):**
                    -   If it's not a DFA, but has no epsilon transitions.
                    -   Can have multiple initial states, or a state might have multiple transitions for the same symbol, or missing transitions for some symbols.
                -   **ε-NFA (Epsilon-NFA):**
                    -   If it contains any epsilon (empty string "") transitions, regardless of other properties. This takes precedence over NFA/DFA if epsilon transitions are present.

                **JSON Output Structure:**
                The final JSON object must have these two top-level keys:
                -   **\`machine\`**: An object containing:
                    -   \`states\` (array of objects): Each with \`id\` (string), \`initial\` (boolean), \`accepting\` (boolean).
                    -   \`transitions\` (array of objects): Each with \`from\` (string), \`to\` (string), \`symbol\` (string).
                -   **\`detectedType\`**: (string) "DFA", "NFA", or "ε-NFA" based on your analysis.

                **Final Check:** Before outputting, ensure every state ID used in the "transitions" array exactly matches an ID in the "states" array.
            `;

            const apiKey = "AIzaSyAJiWZMJlcZAsPzEo8vW35KFH6Yuk8enjc"; // This is a placeholder
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
            
            const jsonStringMatch = text.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonStringMatch || !jsonStringMatch[1]) {
                 throw new Error("Could not find a valid JSON block in the AI's response.");
            }
            const parsedResult = JSON.parse(jsonStringMatch[1]); // Parse the whole response

            if (parsedResult.machine && parsedResult.machine.states && parsedResult.machine.transitions && parsedResult.detectedType) {
                pushUndo(updateUIFunction);
                layoutStatesCircular(parsedResult.machine.states); 
                
                const detectedType = parsedResult.detectedType;
                
                const machineToAnimate = {
                    type: detectedType, // Use AI's detected type
                    ...parsedResult.machine,
                    alphabet: [...new Set(parsedResult.machine.transitions.map(t => t.symbol).filter(s => s))]
                };

                document.getElementById('modeSelect').value = detectedType === 'ε-NFA' ? 'NFA' : detectedType; // Set mode in UI
                animateMachineDrawing(machineToAnimate, detectedType); // Pass detected type to animation
                
            } else {
                throw new Error("AI response did not contain valid 'machine' or 'detectedType'.");
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
