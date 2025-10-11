// === ENHANCEMENTS FILE (CONSOLIDATED & UPGRADED) ===

// --- Helper function for creating delays in animations ---
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Original 5-Tuple Display (Preserved) ---
function display5Tuple() {
    const tupleContainer = document.getElementById('tupleDisplay');
    if (!tupleContainer || !window.MACHINE) return;

    const states = MACHINE.states.map(s => s.id).join(', ');
    const alphabet = [...new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s && s !== 'ε'))].join(', ');
    const initialStates = MACHINE.states.filter(s => s.initial).map(s => s.id).join(', ');
    const finalStates = MACHINE.states.filter(s => s.accepting).map(s => s.id).join(', ');
    
    let transitionStr = '';
    const grouped = {};
    MACHINE.transitions.forEach(t => {
        const key = `${t.from},${t.symbol || 'ε'}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t.to);
    });
    
    Object.entries(grouped).forEach(([key, tos]) => {
        const [from, symbol] = key.split(',');
        transitionStr += `<div class="tuple-item"><span class="tuple-label">δ</span><span class="tuple-value">(${from}, ${symbol}) = {${tos.join(', ')}}</span></div>`;
    });

    tupleContainer.innerHTML = `
        <div class="tuple-display">
            <h4>5-Tuple Definition (${MACHINE.type})</h4>
            <div class="tuple-item"><span class="tuple-label">Q:</span><span class="tuple-value">{${states}}</span></div>
            <div class="tuple-item"><span class="tuple-label">Σ:</span><span class="tuple-value">{${alphabet}}</span></div>
            <div class="tuple-item"><span class="tuple-label">q₀:</span><span class="tuple-value">{${initialStates}}</span></div>
            <div class="tuple-item"><span class="tuple-label">F:</span><span class="tuple-value">{${finalStates}}</span></div>
            <div class="tuple-item"><span class="tuple-label">δ:</span></div>
            ${transitionStr}
        </div>
    `;
}

async function loadMachineFromObject(machineObject) {
    if (!machineObject || !machineObject.states) {
        //...
        return;
    }
    
    // Add this line at the very top of the function
    LAST_ANIMATION_DATA = { type: 'library', data: machineObject };

    IS_ANIMATING = true;
    const replayBtn = document.getElementById('replayAnimationBtn');
    if(replayBtn) replayBtn.disabled = true;
    // ... the rest of the function remains exactly the same, but update the finally block

    // ... inside the try block ...

    // Find the 'finally' block at the end of the function and modify it
    } finally {
        IS_ANIMATING = false;
        if(replayBtn) replayBtn.disabled = false; // Enable replay button
        renderAll();
    }
}
// --- Make All Enhancement Functions Globally Available ---
if (typeof window !== 'undefined') {
    window.display5Tuple = display5Tuple;
    window.loadMachineFromObject = loadMachineFromObject;
    console.log("✓ Enhancements loaded. All helper functions are ready.");
}
