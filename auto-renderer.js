(function() {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Auto Renderer Ready ✅");

   const originalOpenHandler = window.loadMachineFromObject;

       window.loadMachineFromObject = function(machine) {
       if (typeof originalOpenHandler === "function") {
        try { originalOpenHandler(machine); } catch (e) { console.warn("Original handler failed", e); }
      }

      const svg = document.getElementById("automataCanvas") ||
                  document.querySelector("svg") ||
                  document.querySelector(".canvas svg");

      if (!svg) {
        console.error("No SVG canvas found to render automaton!");
        return;
      }

      svg.innerHTML = "";

      const create = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);

    if (machine.transitions) {
        for (const t of machine.transitions) {
          const from = machine.states.find(s => s.id === t.from);
          const to = machine.states.find(s => s.id === t.to);
          if (!from || !to) continue;

          const line = create("line");
          line.setAttribute("x1", from.x);
          line.setAttribute("y1", from.y);
          line.setAttribute("x2", to.x);
          line.setAttribute("y2", to.y);
          line.setAttribute("stroke", "#4a5568");
          line.setAttribute("stroke-width", "2");
          line.setAttribute("marker-end", "url(#arrowhead)");
          svg.appendChild(line);

          const label = create("text");
          label.textContent = t.symbol;
          label.setAttribute("x", (from.x + to.x) / 2);
          label.setAttribute("y", (from.y + to.y) / 2 - 10);
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("font-size", "13");
          label.setAttribute("fill", "#111");
          svg.appendChild(label);
        }
      }

      for (const s of machine.states || []) {
        const circle = create("circle");
        circle.setAttribute("cx", s.x);
        circle.setAttribute("cy", s.y);
        circle.setAttribute("r", "28");
        circle.setAttribute("stroke", s.accepting ? "#16a34a" : "#2563eb");
        circle.setAttribute("stroke-width", s.initial ? "4" : "2");
        circle.setAttribute("fill", s.accepting ? "#e6fffa" : "#fff");
        svg.appendChild(circle);

        const text = create("text");
        text.textContent = s.id;
        text.setAttribute("x", s.x);
        text.setAttribute("y", s.y + 5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "13");
        svg.appendChild(text);

        if (s.initial) {
          const arrow = create("line");
          arrow.setAttribute("x1", s.x - 50);
          arrow.setAttribute("y1", s.y);
          arrow.setAttribute("x2", s.x - 28);
          arrow.setAttribute("y2", s.y);
          arrow.setAttribute("stroke", "#2563eb");
          arrow.setAttribute("stroke-width", "2");
          arrow.setAttribute("marker-end", "url(#arrowhead)");
          svg.appendChild(arrow);
        }
      }

      console.log("✅ Machine drawn instantly:", machine.id || "(unnamed)");
    };
  });
})();
