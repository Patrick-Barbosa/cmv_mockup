function renderTree(node, parent, level = 0) {
  const ul = document.createElement("ul");
  const li = document.createElement("li");
  li.classList.add("node", `level-${level}`);
  
  if (node.children?.length) li.classList.add("expanded");

  const card = document.createElement("div");
  card.className = "card shadow-sm";

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const title = document.createElement("h5");
  title.className = "card-title toggle";
  if (node.children?.length) title.classList.add("has-children");

  const quantidade = node.quantidade.toFixed(2);

  title.innerHTML = `(${node.id}) ${node.nome} (<span class="quantity-actual">${quantidade}kg</span>)`;

  const type = document.createElement("h6");
  type.className = "card-subtitle mb-2 text-muted";
  type.textContent = node.tipo === "receita" ? "Receita" : "Insumo";

  cardBody.appendChild(title);
  cardBody.appendChild(type);
  card.appendChild(cardBody);
  li.appendChild(card);

  if (node.children?.length) {
    title.onclick = () => {
      li.classList.toggle("collapsed");
      li.classList.toggle("expanded");
    };
    node.children.forEach(child => renderTree(child, li, level + 1));
  }

  ul.appendChild(li);
  parent.appendChild(ul);
}

function coletarInsumos(node, raizNome, result = {}) {
  if (node.tipo === "insumo") {
    if (!result[node.nome])
      result[node.nome] = { insumo: node.nome, total: 0, raiz: raizNome };
    result[node.nome].total += node.quantidade;
  }
  if (node.children) {
    node.children.forEach(child => coletarInsumos(child, raizNome, result));
  }
  return result;
}

async function main() {
  renderTree(data, document.getElementById("hierarchy-container"));
  const insumos = coletarInsumos(data, data.nome);
  const tbody = document.getElementById("leaf-table-body");
  Object.values(insumos).forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.raiz}</td><td>${row.insumo}</td><td>${row.total.toFixed(2)}kg</td>`;
    tbody.appendChild(tr);
  });

  // Botões de controle
  document.getElementById("expandAll").onclick = () => {
    document.querySelectorAll(".node").forEach(el => {
      if (el.querySelector(".has-children")) {
        el.classList.remove("collapsed");
        el.classList.add("expanded");
      }
    });
  };

  document.getElementById("collapseAll").onclick = () => {
    document.querySelectorAll(".node").forEach(el => {
      if (el.querySelector(".has-children")) {
        el.classList.remove("expanded");
        el.classList.add("collapsed");
      }
    });
  };

  document.querySelectorAll(".node").forEach(el => {
    if (el.querySelector(".has-children")) {
      el.classList.remove("expanded");
      el.classList.add("collapsed");
    }
  });
}

main();
