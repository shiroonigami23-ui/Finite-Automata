// ENHANCEMENTS FOR FINITE AUTOMATA STUDIO
// This script adds 5-tuple display and fixes animation delays

// Add 5-tuple display function
function display5Tuple() {
    const tupleContainer = document.getElementById('tupleDisplay');
    if (!tupleContainer) return;

    const states = MACHINE.states.map(s => s.id).join(', ');
    const alphabet = [...new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s !== '' && s !== 'ε'))].join(', ');
    const initialStates = MACHINE.states.filter(s => s.initial).map(s => s.id).join(', ');
    const finalStates = MACHINE.states.filter(s => s.accepting).map(s => s.id).join(', ');
    
    let transitionStr = '';
    const grouped = {};
    MACHINE.transitions.forEach(t => {
        const key = `${t.from},${t.symbol}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t.to);
    });
    
    Object.entries(grouped).forEach(([key, tos]) => {
        const [from, symbol] = key.split(',');
        transitionStr += `<div class="tuple-item"><span class="tuple-label">δ</span><span class="tuple-value">(${from}, ${symbol || 'ε'}) = {${tos.join(', ')}}</span></div>`;
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

// Update delays to use 2-second default
const SOLUTION_STEP_DELAY = 2000; // 2 seconds for cinematic view

// Export for use
if (typeof window !== 'undefined') {
    window.display5Tuple = display5Tuple;
    window.SOLUTION_STEP_DELAY = SOLUTION_STEP_DELAY;
}
