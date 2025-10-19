import { convertEnfaToNfa, convertNfaToDfa, minimizeDfa } from './automata.js';

/**
 * A helper function to get a machine into a DFA format, ready for minimization.
 * This is an async function because the underlying conversions are now async.
 * @param {object} machine The machine to convert.
 * @returns {Promise<object>} A DFA representation of the machine.
 */
async function toDfa(machine) {
    // A silent step callback that does nothing, to satisfy the async conversion functions.
    const silentStep = async () => {};
    
    switch(machine.type) {
        case 'DFA':
            return machine;
        case 'NFA':
            return await convertNfaToDfa(machine, silentStep);
        case 'ENFA':
            const nfa = await convertEnfaToNfa(machine, silentStep);
            return await convertNfaToDfa(nfa, silentStep);
        default:
            throw new Error(`Unknown machine type for conversion: ${machine.type}`);
    }
}

function areIsomorphic(dfaA, dfaB) {
    if (dfaA.states.length !== dfaB.states.length) return false;
    if (dfaA.alphabet.sort().join(',') !== dfaB.alphabet.sort().join(',')) return false;
    if (dfaA.states.filter(s => s.accepting).length !== dfaB.states.filter(s => s.accepting).length) return false;

    const initialA = dfaA.states.find(s => s.initial);
    const initialB = dfaB.states.find(s => s.initial);

    if (!initialA || !initialB) return false;

    const visitedA = new Set();
    const mapAtoB = new Map();
    const queue = [[initialA.id, initialB.id]];

    visitedA.add(initialA.id);
    mapAtoB.set(initialA.id, initialB.id);

    while (queue.length > 0) {
        const [idA, idB] = queue.shift();
        const stateA = dfaA.states.find(s => s.id === idA);
        const stateB = dfaB.states.find(s => s.id === idB);

        if (stateA.accepting !== stateB.accepting) return false;

        for (const symbol of dfaA.alphabet) {
            const transA = dfaA.transitions.find(t => t.from === idA && t.symbol === symbol);
            const transB = dfaB.transitions.find(t => t.from === idB && t.symbol === symbol);

            if (!transA || !transB) return false; 

            const nextIdA = transA.to;
            const nextIdB = transB.to;

            if (mapAtoB.has(nextIdA)) {
                if (mapAtoB.get(nextIdA) !== nextIdB) {
                    return false; // Inconsistent mapping
                }
            } else {
                mapAtoB.set(nextIdA, nextIdB);
                visitedA.add(nextIdA);
                queue.push([nextIdA, nextIdB]);
            }
        }
    }

    return visitedA.size === dfaA.states.length;
}


/**
 * The main function to check for logical equivalence between two automata.
 * @param {object} machineA The first automaton.
 * @param {object} machineB The second automaton.
 * @returns {Promise<boolean>} A promise that resolves to true if they are equivalent.
 */
export async function areEquivalent(machineA, machineB) {
    try {
        // A silent step callback that does nothing, to satisfy the async minimization functions.
        const silentStep = async () => {};

        // Convert both machines to DFA format.
        const dfaA = await toDfa(machineA);
        const dfaB = await toDfa(machineB);

        // Minimize both DFAs.
        const minDfaA = await minimizeDfa(dfaA, silentStep);
        const minDfaB = await minimizeDfa(dfaB, silentStep);

        // Check if the minimized DFAs are isomorphic.
        return areIsomorphic(minDfaA, minDfaB);
    } catch (e) {
        console.error("Equivalence check failed:", e);
        return false;
    }
}
