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
    const newTrans = [];
    const seen = new Set();
    
    await stepCallback({ ...m, transitions: [] }, "Starting ε-NFA to NFA conversion. Removing all transitions first.");

    for (const st of m.states) {
        const closure = computeEpsilonClosure(st.id, m.transitions);
        await stepCallback(m, `Computed ε-closure for <strong>${st.id}</strong>: {${closure.join(', ')}}.`);

        for (const closureStateId of closure) {
            for (const t of m.transitions) {
                if (t.from === closureStateId && t.symbol !== '' && t.symbol !== 'ε') {
                    const destClosure = computeEpsilonClosure(t.to, m.transitions);
                    
                    await stepCallback(m, `From closure of ${st.id}, found transition ${closureStateId} → ${t.to} on '<strong>${t.symbol}</strong>'. Destination ε-closure is {${destClosure.join(', ')}}.`);

                    for (const dest of destClosure) {
                        const key = `${st.id}->${dest}:${t.symbol}`;
                        if (!seen.has(key)) {
                            newTrans.push({ from: st.id, to: dest, symbol: t.symbol });
                            seen.add(key);
                            await stepCallback({ ...m, transitions: [...newTrans] }, `Adding new transition: <strong>${st.id}</strong> → <strong>${dest}</strong> on '<strong>${t.symbol}</strong>'.`);
                        }
                    }
                }
            }
        }
         const closureStates = m.states.filter(s => closure.includes(s.id));
        if (closureStates.some(cs => cs.accepting)) {
            const originalState = m.states.find(x => x.id === st.id);
            if (originalState && !originalState.accepting) {
                originalState.accepting = true;
                await stepCallback(m, `State <strong>${st.id}</strong> is now accepting because its closure contains an accepting state.`);
            }
        }
    }
    m.transitions = newTrans.filter(t => t.symbol !== '' && t.symbol !== 'ε');
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

    const dfaStatesData = new Map();
    const queue = [initialDFAStateSet];
    const newMachine = { type: 'DFA', states: [], transitions: [], alphabet };

    dfaStatesData.set(initialKey, { id: initialKey, isAccepting: initialDFAStateSet.some(s => nfaMachine.states.find(ns => ns.id === s)?.accepting) });
    
    newMachine.states.push({ id: initialKey, initial: true, accepting: dfaStatesData.get(initialKey).isAccepting });
    await stepCallback(newMachine, `Initial DFA state created from ε-closure of NFA start states: <strong>${initialKey}</strong>.`);

    let processedIndex = 0;
    while(processedIndex < newMachine.states.length){
        const currentKey = newMachine.states[processedIndex].id;
        const currentSet = currentKey.slice(1, -1).split(',').filter(Boolean);
        
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
            
            if (nextKey === '{}') {
                if (!dfaStatesData.has(nextKey)) {
                     newMachine.states.push({ id: nextKey, initial: false, accepting: false });
                     dfaStatesData.set(nextKey, { id: nextKey, isAccepting: false });
                     await stepCallback(newMachine, `Created trap state <strong>${nextKey}</strong>.`);
                }
            }
            else if (!dfaStatesData.has(nextKey)) {
                const isAccepting = nextSetClosure.some(s => nfaMachine.states.find(ns => ns.id === s)?.accepting);
                newMachine.states.push({ id: nextKey, initial: false, accepting: isAccepting });
                dfaStatesData.set(nextKey, { id: nextKey, isAccepting: isAccepting });
                await stepCallback(newMachine, `Found new DFA state from {${currentSet.join(',')}} on '<strong>${symbol}</strong>': <strong>${nextKey}</strong>.`);
            }

            newMachine.transitions.push({ from: currentKey, to: nextKey, symbol: symbol });
            await stepCallback(newMachine, `Adding transition: δ(<strong>${currentKey}</strong>, '<strong>${symbol}</strong>') = <strong>${nextKey}</strong>.`);
        }
        processedIndex++;
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

    await stepCallback(dfaClean, `Step 2: Initial partition into accepting and non-accepting states. Groups: ${P.map(g => `{${g.join(',')}}`).join(', ')}`);

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
                        if (intersection.length <= difference.length) {
                            W.push(intersection);
                        } else {
                            W.push(difference);
                        }
                    }
                } else {
                    newP.push(Y);
                }
            }
             if(changed) {
                P = newP;
                await stepCallback(dfaClean, `Refining partition based on symbol '<strong>${symbol}</strong>'. New groups: ${P.map(g => `{${g.join(',')}}`).join(', ')}`);
            }
        }
    }
    
    const repMap = {};
    P.forEach(group => {
        const rep = group.sort()[0];
        group.forEach(s => repMap[s] = rep);
    });

    const finalStates = P.map((group) => {
        const rep = group.sort()[0];
        const oldState = dfaClean.states.find(s => s.id === rep);
        const isInitial = dfaClean.states.some(s => s.initial && group.includes(s.id));
        return { id: rep, initial: isInitial, accepting: oldState.accepting };
    });
    
    await stepCallback({ ...dfaClean, states: finalStates, transitions: [] }, `Step 3: Created new states from final partitions.`);

    const finalTransitions = [];
    finalStates.forEach(s => {
        const originalStateId = P.find(g => g.includes(s.id))[0];
        alph.forEach(symbol => {
            const t = dfaClean.transitions.find(tr => tr.from === originalStateId && tr.symbol === symbol);
            if (t) {
                const toRep = repMap[t.to];
                if (!finalTransitions.some(ft => ft.from === s.id && ft.to === toRep && ft.symbol === symbol)) {
                     finalTransitions.push({ from: s.id, to: toRep, symbol });
                }
            }
        });
    });
    
    await stepCallback({ ...dfaClean, states: finalStates, transitions: finalTransitions }, `Step 4: Remapped transitions to new states.`);
    
    return { type: 'DFA', alphabet: alph, states: finalStates, transitions: finalTransitions };
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
