// automata.js
import { MACHINE } from './state.js';

export function validateAutomaton() {
    if (!MACHINE || !Array.isArray(MACHINE.states) || !Array.isArray(MACHINE.transitions)) {
        return { type: 'error', message: 'Invalid machine structure.' };
    }

    const { states, transitions, type } = MACHINE;
    const stateIds = new Set(states.map(s => s.id));
    
    if (states.length === 0) {
        return { type: 'info', message: 'Canvas is empty.' };
    }

    const initialStates = states.filter(s => s.initial);
    if (initialStates.length === 0) {
        return { type: 'error', message: 'No initial state defined.' };
    }
    if (type === 'DFA' && initialStates.length > 1) {
        return { type: 'error', message: 'DFA cannot have multiple initial states.' };
    }

    for (const t of transitions) {
        if (!stateIds.has(t.from) || !stateIds.has(t.to)) {
            return { type: 'error', message: `Transition refers to non-existent state.` };
        }
    }

    if (type === 'DFA') {
        for (const state of states) {
            const symbols = new Set();
            for (const t of transitions.filter(tr => tr.from === state.id)) {
                if (t.symbol === '' || t.symbol === 'ε') {
                    return { type: 'error', message: `DFA state ${state.id} has an ε-transition.` };
                }
                if (symbols.has(t.symbol)) {
                    return { type: 'error', message: `DFA state ${state.id} is not deterministic for symbol '${t.symbol}'.` };
                }
                symbols.add(t.symbol);
            }
        }
    }

    return { type: 'success', message: 'Automaton is valid.' };
}


export async function convertEnfaToNfa(machine, stepCallback = async () => {}) {
    const m = JSON.parse(JSON.stringify(machine));
    let tempTransitions = [];
    
    await stepCallback({ ...m, transitions: [] }, "Starting ε-NFA to NFA conversion. Current transitions cleared.");

    for (const st of m.states) {
        const closure = computeEpsilonClosure(st.id, m.transitions);
        await stepCallback({ ...m, transitions: tempTransitions }, `Computed ε-closure for <strong>${st.id}</strong>: {${closure.join(', ')}}.`);

        const closureStates = m.states.filter(s => closure.includes(s.id));
        if (closureStates.some(cs => cs.accepting)) {
            const originalState = m.states.find(x => x.id === st.id);
            if (originalState && !originalState.accepting) {
                originalState.accepting = true;
                await stepCallback({ ...m, transitions: tempTransitions }, `State <strong>${st.id}</strong> is now accepting because its closure contains an accepting state.`);
            }
        }

        for (const closureStateId of closure) {
            for (const t of m.transitions) {
                if (t.from === closureStateId && t.symbol !== '' && t.symbol !== 'ε') {
                    const destClosure = computeEpsilonClosure(t.to, m.transitions);
                    
                    for (const dest of destClosure) {
                        const alreadyExists = tempTransitions.some(nt => nt.from === st.id && nt.to === dest && nt.symbol === t.symbol);
                        if (!alreadyExists) {
                            tempTransitions.push({ from: st.id, to: dest, symbol: t.symbol });
                            await stepCallback({ ...m, transitions: [...tempTransitions] }, `Adding new transition: <strong>${st.id}</strong> → <strong>${dest}</strong> on '<strong>${t.symbol}</strong>'.`);
                        }
                    }
                }
            }
        }
    }
    m.transitions = tempTransitions;
    m.type = 'NFA';
    
    m.states.forEach(s => { delete s.x; delete s.y; });
    return m;
}

export async function convertNfaToDfa(nfa, stepCallback = async () => {}) {
    const nfaMachine = nfa.type === 'ENFA' ? await convertEnfaToNfa(nfa) : nfa;
    const alphabet = Array.from(new Set(nfaMachine.transitions.map(t => t.symbol).filter(s => s && s !== 'ε')));
    
    const mapKey = (arr) => '{' + arr.sort().join(',') + '}';
    
    const initialNFAStates = nfaMachine.states.filter(s => s.initial).map(s => s.id);
    const initialDFAStateSet = computeEpsilonClosure(initialNFAStates, nfaMachine.transitions);
    const initialKey = mapKey(initialDFAStateSet);

    const dfaStateKeys = new Set();
    const queue = [initialDFAStateSet];
    const newMachine = { type: 'DFA', states: [], transitions: [], alphabet };

    dfaStateKeys.add(initialKey);
    const isInitialAccepting = initialDFAStateSet.some(s => nfaMachine.states.find(ns => ns.id === s)?.accepting);
    newMachine.states.push({ id: initialKey, initial: true, accepting: isInitialAccepting });
    await stepCallback(newMachine, `Initial DFA state created from ε-closure of NFA start states: <strong>${initialKey}</strong>.`);

    let head = 0;
    while(head < queue.length){
        const currentSet = queue[head++];
        const currentKey = mapKey(currentSet);
        
        await stepCallback(newMachine, `Processing new DFA state: <strong>${currentKey}</strong>.`);

        for (const symbol of alphabet) {
            const nextNfaStates = new Set();
            for (const stateId of currentSet) {
                nfaMachine.transitions
                    .filter(t => t.from === stateId && t.symbol === symbol)
                    .forEach(t => nextNfaStates.add(t.to));
            }

            const nextSetClosure = computeEpsilonClosure(Array.from(nextNfaStates), nfaMachine.transitions);
            const nextKey = mapKey(nextSetClosure);
            
            if (!dfaStateKeys.has(nextKey)) {
                 dfaStateKeys.add(nextKey);
                 queue.push(nextSetClosure);
                 const isAccepting = nextSetClosure.some(s => nfaMachine.states.find(ns => ns.id === s)?.accepting);
                 newMachine.states.push({ id: nextKey, initial: false, accepting: isAccepting });
                 await stepCallback(newMachine, `Found new DFA state from {${currentSet.join(',')}} on '<strong>${symbol}</strong>': <strong>${nextKey}</strong>.`);
            }

            newMachine.transitions.push({ from: currentKey, to: nextKey, symbol: symbol });
            await stepCallback(newMachine, `Adding transition: δ(<strong>${currentKey}</strong>, '<strong>${symbol}</strong>') = <strong>${nextKey}</strong>.`);
        }
    }

    if (!dfaStateKeys.has('{}')) {
        newMachine.states.push({ id: '{}', initial: false, accepting: false });
        for(const symbol of alphabet) {
            newMachine.transitions.push({ from: '{}', to: '{}', symbol: symbol });
        }
    }

    return newMachine;
}

export async function minimizeDfa(dfa, stepCallback = async () => {}) {
    const dfaClean = removeUnreachableStates(dfa);
    await stepCallback(dfaClean, "Step 1: Removed unreachable states.");
    
    if (dfaClean.states.length === 0) return dfaClean;

    const alph = dfaClean.alphabet;
    let P = [
        dfaClean.states.filter(s => s.accepting).map(s => s.id),
        dfaClean.states.filter(s => !s.accepting).map(s => s.id)
    ].filter(g => g.length > 0);

    await stepCallback(dfaClean, `Step 2: Initial partition. Groups: ${P.map(g => `{${g.join(',')}}`).join(', ')}`);

    let W = [...P];
    while (W.length > 0) {
        const A = W.shift();
        for (const symbol of alph) {
            const X = dfaClean.transitions.filter(t => t.symbol === symbol && A.includes(t.to)).map(t => t.from);
            if (X.length === 0) continue;
            
            const newP = [];
            let changed = false;
            for (const Y of P) {
                const intersection = Y.filter(s => X.includes(s));
                const difference = Y.filter(s => !X.includes(s));

                if (intersection.length > 0 && difference.length > 0) {
                    newP.push(intersection, difference);
                    changed = true;
                    const wIndex = W.findIndex(g => g.every(s => Y.includes(s)) && g.length === Y.length);
                    if (wIndex > -1) {
                        W.splice(wIndex, 1, intersection, difference);
                    } else {
                        W.push(intersection.length <= difference.length ? intersection : difference);
                    }
                } else {
                    newP.push(Y);
                }
            }
             if(changed) {
                P = newP;
                await stepCallback(dfaClean, `Refining partition on '<strong>${symbol}</strong>'. New groups: ${P.map(g => `{${g.join(',')}}`).join(', ')}`);
            }
        }
    }
    
    const repMap = {};
    P.forEach(group => {
        const rep = group.sort()[0];
        group.forEach(s => repMap[s] = rep);
    });

    const finalMachine = { type: 'DFA', alphabet: alph, states: [], transitions: [] };

    await stepCallback(dfaClean, `Step 3: Final partitions found. Building minimized DFA.`);

    for (const group of P) {
        const rep = group.sort()[0];
        const oldState = dfaClean.states.find(s => s.id === rep);
        const isInitial = dfaClean.states.some(s => s.initial && group.includes(s.id));
        finalMachine.states.push({ id: rep, initial: isInitial, accepting: oldState.accepting });
        await stepCallback(finalMachine, `Creating new state for group {${group.join(',')}}, represented by <strong>${rep}</strong>.`);
    }

    for (const state of finalMachine.states) {
        const originalStateId = state.id;
        for (const symbol of alph) {
            const t = dfaClean.transitions.find(tr => tr.from === originalStateId && tr.symbol === symbol);
            if (t) {
                const toRep = repMap[t.to];
                if (!finalMachine.transitions.some(ft => ft.from === state.id && ft.to === toRep && ft.symbol === symbol)) {
                     finalMachine.transitions.push({ from: state.id, to: toRep, symbol });
                     await stepCallback(finalMachine, `Adding transition: δ(<strong>${state.id}</strong>, '<strong>${symbol}</strong>') = <strong>${toRep}</strong>.`);
                }
            }
        }
    }
    
    return finalMachine;
}


export function computeEpsilonClosure(states, transitions) {
    const stateSet = new Set(Array.isArray(states) ? states : [states]);
    const stack = Array.isArray(states) ? [...states] : [states];

    while (stack.length > 0) {
        const s = stack.pop();
        if (!s) continue;

        for (const t of transitions) {
            if (t.from === s && (t.symbol === '' || t.symbol === 'ε')) {
                if (!stateSet.has(t.to)) {
                    stateSet.add(t.to);
                    stack.push(t.to);
                }
            }
        }
    }
    return Array.from(stateSet);
}

function removeUnreachableStates(dfa) {
    const reachable = new Set();
    const initialState = dfa.states.find(s => s.initial);
    if (!initialState) {
        return { ...dfa, states: [], transitions: [] };
    }

    const stack = [initialState.id];
    reachable.add(initialState.id);

    while (stack.length > 0) {
        const currentId = stack.pop();
        dfa.transitions
            .filter(t => t.from === currentId)
            .forEach(t => {
                if (!reachable.has(t.to)) {
                    reachable.add(t.to);
                    stack.push(t.to);
                }
            });
    }

    const reachableStates = dfa.states.filter(s => reachable.has(s.id));
    const reachableTransitions = dfa.transitions.filter(t => reachable.has(t.from) && reachable.has(t.to));

    return { ...dfa, states: reachableStates, transitions: reachableTransitions };
}
