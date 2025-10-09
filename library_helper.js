function loadMachineFromObject(machineObject) {
  if (!machineObject || !machineObject.states) {
    console.error("Invalid machine object provided to load.");
    return;
  }

 if (typeof pushUndo === 'function') {
    pushUndo();
  }

   window.MACHINE = machineObject;

  const modeSelect = document.getElementById('modeSelect');
  if (modeSelect && window.MACHINE.type) {
    const baseType = window.MACHINE.type.split('_TO_')[0];
    if (['DFA', 'NFA', 'ENFA'].includes(baseType)) {
      modeSelect.value = baseType;
    }
  }
  
if (typeof layoutStatesLine === 'function') {
    layoutStatesLine(window.MACHINE.states);
  } else {
    if (typeof renderAll === 'function') {
      renderAll();
    }
  }

  const validationLine = document.getElementById('validationLine');
  if (validationLine) {
    const title = machineObject.title || machineObject.id || 'machine';
    validationLine.textContent = `Loaded "${title}" from library.`;
    validationLine.className = 'validation-box show success';
    setTimeout(() => { validationLine.classList.remove('show'); }, 4000);
  }
}
