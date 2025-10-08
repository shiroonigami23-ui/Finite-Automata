// Animation Delay Fix Script
// This script updates the hardcoded animation delays to use 2-second default

// Constants
const SOLUTION_STEP_DELAY = 2000; // 2 seconds for cinematic view
const STATE_DRAW_DELAY = 2000;
const TRANSITION_DRAW_DELAY = 2000;

// Export for global use
if (typeof window !== 'undefined') {
    window.SOLUTION_STEP_DELAY = SOLUTION_STEP_DELAY;
    window.STATE_DRAW_DELAY = STATE_DRAW_DELAY;
    window.TRANSITION_DRAW_DELAY = TRANSITION_DRAW_DELAY;
}

// Note: To apply this fix to your existing script.js:
// Replace await sleep(400) with await sleep(SOLUTION_STEP_DELAY || 2000)
// Replace await sleep(500) with await sleep(SOLUTION_STEP_DELAY || 2000)
// in the showSolBtn click handler (around lines 4438 and 4465)
