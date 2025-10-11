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
        console.error("Invalid machine object provided to load.");
        return;
    }

    IS_ANIMATING = true; // <-- Switch ON
    try {
        const animationDelay = 2000; 

        if (typeof pushUndo === 'function') {
            pushUndo();
        }

        const title = machineObject.title || machineObject.id || 'machine';
        const preservedType = machineObject.type || 'DFA';
        
        const tempMachine = { ...machineObject, states: [], transitions: [], type: preservedType };
        window.MACHINE = tempMachine;
        if (typeof renderAll === 'function') {
            renderAll();
        }
        
        const stepLog = document.getElementById('stepLog');
        if (stepLog) {
            stepLog.innerHTML = `<div><i data-lucide="zap"></i> **Loading "${title}" from library...**</div>`;
            if (window.lucide?.createIcons) window.lucide.createIcons();
        }

        const addConstructionLog = (message) => {
            if (!stepLog) return;
            stepLog.innerHTML = `<div class="new-log"><i data-lucide="edit"></i> ${message}</div>` + stepLog.innerHTML;
            if (window.lucide?.createIcons) window.lucide.createIcons();
        };

        const statesToLoad = machineObject.states;
        const needsLayout = statesToLoad.some(s => s.x === undefined || s.y === undefined);
        if (needsLayout) {
            addConstructionLog("Machine needs layout. Calculating positions...");
            const canvasWidth = 1400; const marginX = 150; const spacingX = 180;
            const perRow = Math.max(1, Math.floor((canvasWidth - marginX * 2) / spacingX));
            statesToLoad.forEach((s, i) => {
                const row = Math.floor(i / perRow);
                const col = i % perRow;
                s.x = marginX + col * spacingX;
                s.y = 150 + row * 150;
            });
        }

        for (const state of statesToLoad) {
            window.MACHINE.states.push(state);
            if (typeof renderAll === 'function') renderAll();
            let message = `**Added state ${state.id}**`;
            if (state.initial) message += " (Set as **Initial**)";
            if (state.accepting) message += " (Set as **Final**)";
            addConstructionLog(message);
            const stateG = document.querySelector(`g[data-id="${state.id}"]`);
            if (stateG) stateG.querySelector('circle')?.classList.add('state-drawing');
            await sleep(animationDelay); 
            if (stateG) stateG.querySelector('circle')?.classList.remove('state-drawing');
        }

        const transitionsToLoad = machineObject.transitions || [];
        for (const transition of transitionsToLoad) {
            window.MACHINE.transitions.push(transition);
            if (typeof updateAlphabet === 'function') updateAlphabet();
            if (typeof renderAll === 'function') renderAll();
            addConstructionLog(`**Drawing transition** from ${transition.from} to ${transition.to} on symbol '${transition.symbol || 'ε'}'`);
            const pathEl = document.querySelector(`.transition-path[data-from="${transition.from}"][data-to="${transition.to}"]`);
            if (pathEl) pathEl.classList.add('transition-drawing');
            await sleep(animationDelay);
        }

        window.MACHINE = JSON.parse(JSON.stringify(machineObject));
        window.MACHINE.type = preservedType;

        if (typeof enforceInitialStateRule === 'function') {
            enforceInitialStateRule();
        }
        addConstructionLog(`**Construction Complete!** "${title}" loaded.`);
        if (typeof renderAll === 'function') renderAll();
        
        const validationLine = document.getElementById('validationLine');
        if (validationLine) {
            validationLine.textContent = `Loaded "${title}" from library.`;
            validationLine.className = 'validation-box show success';
            setTimeout(() => { validationLine.classList.remove('show'); }, 4000);
        }
    }finally {
        IS_ANIMATING = false; // <-- Switch OFF
        renderAll(); // <-- Final render to restore logs
    }
}  


// --- Make All Enhancement Functions Globally Available ---
if (typeof window !== 'undefined') {
    window.display5Tuple = display5Tuple;
    window.loadMachineFromObject = loadMachineFromObject;
    console.log("✓ Enhancements loaded. All helper functions are ready.");
}
