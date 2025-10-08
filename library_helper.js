// A helper function to load a machine from the library onto the canvas
function loadMachineFromObject(machineObject) {
  // Check if the provided object is a valid machine
  if (!machineObject || !machineObject.states) {
    console.error("Invalid machine object provided to load.");
    return;
  }

  // Use the pushUndo function from script.js to save the current state
  if (typeof pushUndo === 'function') {
    pushUndo();
  }

  // Set the global MACHINE variable (from script.js) to the new object
  window.MACHINE = machineObject;

  // Find the mode dropdown in the HTML
  const modeSelect = document.getElementById('modeSelect');
  if (modeSelect && window.MACHINE.type) {
    // This makes sure the dropdown UI matches the type of the loaded machine
    const baseType = window.MACHINE.type.split('_TO_')[0];
    if (['DFA', 'NFA', 'ENFA'].includes(baseType)) {
      modeSelect.value = baseType;
    }
  }
  
  // Use the renderAll function from script.js to draw the new machine
  if (typeof renderAll === 'function') {
    renderAll();
  }

  // Show a confirmation message on the screen
  const validationLine = document.getElementById('validationLine');
  if (validationLine) {
    const title = machineObject.title || machineObject.id || 'machine';
    validationLine.textContent = `Loaded "${title}" from library.`;
    validationLine.className = 'validation-box show success';
    // Hide the message after 4 seconds
    setTimeout(() => { validationLine.classList.remove('show'); }, 4000);
  }
}
