import { MACHINE, simState } from './state.js';
import { sleep } from './utils.js';
import { computeEpsilonClosure } from './automata.js';

export async function runSimulation(inputStr) {
    simState.steps.length = 0;
    simState.index = 0; 
    clearTimeout(simState.timer);
    document.getElementById('stepLog').innerHTML = '';
    const testOutput = document.getElementById('testOutput');
    testOutput.textContent = 'Simulating...';
    
    const startStates = MACHINE.states.filter(s => s.initial).map(s => s.id);

    if (startStates.length === 0) {
        testOutput.textContent = 'Error: No initial state defined.';
        testOutput.style.color = '#e53e3e';
        return;
    }

    let currentStates = (MACHINE.type === 'ENFA') ? computeEpsilonClosure(startStates, MACHINE.transitions) : [...startStates];
    
    if (MACHINE.type === 'DFA' && currentStates.length > 1) {
        currentStates = [currentStates[0]];
    }
    
    simState.steps.push({ start: true, active: [...currentStates] });

    let halted = false;
    for (const symbol of inputStr) {
        if (halted) break;

        const frame = { before: [...currentStates], symbol: symbol, steps: [], after: [] };
        const nextStates = new Set();
        
        if (MACHINE.type === 'DFA') {
            if (currentStates.length > 0) {
                const transition = MACHINE.transitions.find(t => t.from === currentStates[0] && t.symbol === symbol);
                if (transition) {
                    frame.steps.push({ from: transition.from, to: transition.to, symbol: transition.symbol });
                    nextStates.add(transition.to);
                }
            }
        } 
        else { 
            for (const stateId of currentStates) {
                MACHINE.transitions
                    .filter(t => t.from === stateId && t.symbol === symbol)
                    .forEach(t => {
                        frame.steps.push({ from: t.from, to: t.to, symbol: t.symbol });
                        nextStates.add(t.to);
                    });
            }
        }

        const afterStates = (MACHINE.type === 'ENFA') ? computeEpsilonClosure([...nextStates], MACHINE.transitions) : [...nextStates];
        
        frame.after = afterStates;
        simState.steps.push(frame);
        currentStates = afterStates;

        if (currentStates.length === 0) {
            halted = true;
        }
    }
    
    simState.steps.push({ end: true, active: [...currentStates] });

    document.getElementById('manualButtons').style.display = 'none';
    playAuto();
}

export async function showStep(idx) {
    if (idx < 0 || idx >= simState.steps.length) {
        simState.index = Math.max(0, Math.min(idx, simState.steps.length - 1));
        return;
    }
    simState.index = idx;
    const step = simState.steps[idx];
    const log = document.getElementById('stepLog');
    const speed = parseInt(document.getElementById('testSpeed').value || '500');

    document.querySelectorAll('.state-animating, .transition-animating').forEach(el => el.classList.remove('state-animating', 'transition-animating'));

    if (idx === 0) log.innerHTML = '';

    if (step.end) {
        const isAccepted = (step.active || []).some(sid => MACHINE.states.find(s => s.id === sid && s.accepting));
        const testOutput = document.getElementById('testOutput');
        testOutput.textContent = isAccepted ? 'Accepted' : 'Rejected';
        testOutput.style.color = isAccepted ? '#38a169' : '#e53e3e';
      
        step.active.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
      
        const finalLog = `<div><strong>Final active states: {${(step.active || []).join(', ') || '∅'}}</strong></div>`;
        const resultLog = `<div><strong style="color:${isAccepted ? '#4ade80' : '#f87171'}">${isAccepted ? '✔ Accepted' : '✘ Rejected'}</strong></div>`;
        log.innerHTML = resultLog + finalLog + log.innerHTML;
        return;
    }

    if (step.start) {
        log.innerHTML = `<div><strong>Initial active states: {${(step.active || []).join(', ')}}</strong></div>` + log.innerHTML;
        step.active.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
        return;
    }
    
    document.getElementById('testOutput').textContent = `Processing '${step.symbol}'... Active: {${(step.after || []).join(', ') || '∅'}}`;

    step.before.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
    await sleep(speed / 2);

    if (step.steps.length > 0) {
        step.steps.forEach(s => {
            log.innerHTML = `<div>Read '<b>${s.symbol}</b>': δ(${s.from}, ${s.symbol}) → ${s.to}</div>` + log.innerHTML;
            document.querySelector(`.transition-path[data-from="${s.from}"][data-to="${s.to}"]`)?.classList.add('transition-animating');
        });
    } else {
        log.innerHTML = `<div>Read '<b>${step.symbol}</b>': No transitions from {${step.before.join(', ')}}. Halting.</div>` + log.innerHTML;
    }
    
    await sleep(speed / 2);

    document.querySelectorAll('.state-animating, .transition-animating').forEach(el => el.classList.remove('state-animating', 'transition-animating'));
    step.after.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
}

async function playAuto() {
    for (let i = 0; i < simState.steps.length; i++) {
        await showStep(i);
        const speed = parseInt(document.getElementById('testSpeed').value || '800');
        if (i < simState.steps.length - 1) {
            await sleep(speed);
        }
    }
}
