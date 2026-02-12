import { $, $e } from "/lib/utils.js";
const MIN_BASE = 2;
const MAX_BASE = 32;
const numTables = 3;
const input = $("input");
// get the container div
const container = $("#table-container");
const rowsPerTable = Math.floor((MAX_BASE - MIN_BASE) / numTables);
function generateTables(value) {
    for (let i = 0; i < numTables; ++i) {
        const table = $e("table", { class: "bases-table" });
        // table header
        table.append($e("thead", {}, $e("tr", {}, [$e("th", {}, "Base"), $e("th", {}, "Value")])));
        // table body
        const tbody = $e("tbody");
        for (let j = 0; j < rowsPerTable; ++j) {
            const base = MIN_BASE + i * rowsPerTable + j;
            if (base > MAX_BASE)
                break;
            tbody.append($e("tr", {}, [$e("th", {}, base), $e("td", {}, value.toString(base))]));
        }
        table.append(tbody);
        // append to container
        container.append(table);
    }
}
// input events
input.addEventListener("input", () => {
    container.replaceChildren();
    generateTables(input.valueAsNumber);
});
// initialize page
generateTables($("input").valueAsNumber);
//# sourceMappingURL=bases.js.map