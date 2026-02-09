(() => {
  const MIN_BASE = 2;
  const MAX_BASE = 32;
  const numTables = 3;

  const input = document.querySelector("input");


  // get the container div
  const container = document.getElementById("table-container");

  const rowsPerTable = Math.floor((MAX_BASE - MIN_BASE) / numTables);

  function generateTables(value) {
    for (let i = 0; i < numTables; ++i) {
      const table = document.createElement("table");
      table.classList.add("bases-table");

      // table header
      const thead = document.createElement("thead");
      {
        const tr = document.createElement("tr");
        {
          const th = document.createElement("th");
          th.appendChild(document.createTextNode("Base"));
          tr.appendChild(th);
        }
        {
          const th = document.createElement("th");
          th.appendChild(document.createTextNode("Value"));
          tr.appendChild(th);
        }

        thead.appendChild(tr);
      }
      table.appendChild(thead);

      // table body
      const tbody = document.createElement("tbody");
      for (let j = 0; j < rowsPerTable; ++j) {
        const base = MIN_BASE + i * rowsPerTable + j;
        if (base > MAX_BASE) break;

        const tr = document.createElement("tr");

        const th = document.createElement("th");
        th.appendChild(document.createTextNode(base));
        tr.appendChild(th);

        const td = document.createElement("th");
        td.appendChild(document.createTextNode(value.toString(base)));
        tr.appendChild(td);

        tbody.appendChild(tr);
      }

      table.appendChild(tbody);

      // append to container
      container.appendChild(table);
    }
  }

  // input events
  document.addEventListener("input", input, () => {
    container.children.length = 0;

    const value = parseInt(input.value);

    generateTables(value);
  });

  // initialize page
  generateTables(document.querySelector("input").value)
})();
