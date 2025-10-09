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


function loadMachineFromObject(machineObject) {
  if (!machineObject || !machineObject.states) {
    console.error("Invalid machine object provided to load.");
    return;
  }

  // Use functions from script.js if they exist
  if (typeof pushUndo === 'function') {
    pushUndo();
  }

  // Set the global MACHINE variable
  window.MACHINE = machineObject;

  // --- Self-Contained Layout Logic ---
  // This part guarantees that all states have x/y coordinates before drawing.
  const states = window.MACHINE.states;
  const needsLayout = states.some(s => s.x === undefined || s.y === undefined);

  if (needsLayout) {
    console.log("Machine states need layout. Calculating positions...");
    const canvasWidth = 1400;
    const marginX = 150;
    const spacingX = 180;
    const perRow = Math.floor((canvasWidth - marginX * 2) / spacingX);

    states.forEach((s, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      s.x = marginX + col * spacingX;
      s.y = 150 + row * 150;
    });
  }
  if (typeof renderAll === 'function') {
    renderAll();
  } else {
    console.error("The main renderAll() function was not found!");
  }

  // Update the mode dropdown
  const modeSelect = document.getElementById('modeSelect');
  if (modeSelect && window.MACHINE.type) {
    const baseType = window.MACHINE.type.split('_TO_')[0];
    if (['DFA', 'NFA', 'ENFA'].includes(baseType)) {
      modeSelect.value = baseType;
    }
  }

  // Show a confirmation message
  const validationLine = document.getElementById('validationLine');
  if (validationLine) {
    const title = machineObject.title || machineObject.id || 'machine';
    validationLine.textContent = `Loaded "${title}" from library.`;
    validationLine.className = 'validation-box show success';
    setTimeout(() => { validationLine.classList.remove('show'); }, 4000);
  }
}


// --- Make All Enhancement Functions Globally Available ---
if (typeof window !== 'undefined') {
    window.display5Tuple = display5Tuple;
    window.loadMachineFromObject = loadMachineFromObject;
    console.log("✓ Enhancements loaded. All helper functions are ready.");
}
