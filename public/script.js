let category = "All";

async function load() {
  const search = document.getElementById("search").value;

  const res = await fetch(`/api/products?category=${category}&search=${search}`);
  const data = await res.json();

  let html = "";
  data.forEach(p => {
    html += `
    <div class="card">
      <img src="${p.images[0]}">
      <h3>${p.name}</h3>
      <p>$${p.price}</p>
    </div>`;
  });

  document.getElementById("products").innerHTML = html;
}

function filter(c) {
  category = c;
  load();
}

document.getElementById("search").oninput = load;

load();