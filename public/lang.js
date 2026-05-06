const langData = {
  en: {
    search: "Search products...",
    add: "Select Complete Option",
    title: "New Products",
    empty: "No products found",
    added: "Added",
    outStock: "Out of Stock",
    home: "Home",
    cart: "Cart",
    setting: "Setting",
    account: "Account"
  },
  kh: {
    search: "ស្វែងរកទំនិញ...",
    add: "ជ្រើសរើសរួចបញ្ចូល",
    title: "ផលិតផលថ្មីៗ",
    empty: "រកមិនឃើញទំនិញ",
    added: "បានដាក់ក្នុងកន្ត្រក",
    outStock: "អស់ស្តុក",
    home: "ទំព័រដើម",
    cart: "កន្ត្រក",
    setting: "ការកំណត់",
    account: "គណនី"
  }
};

function currentLang() {
  return localStorage.getItem("lang") || "en";
}

function text() {
  return langData[currentLang()] || langData.en;
}

function setLang(lang) {
  localStorage.setItem("lang", lang);

  if (typeof renderCategories === "function") {
    renderCategories();
  }

  if (typeof renderProducts === "function" && Array.isArray(window.productsData)) {
    renderProducts(window.productsData);
  } else if (typeof renderProducts === "function" && typeof productsData !== "undefined") {
    renderProducts(productsData);
  }

  applyLang();
}

function applyLang() {
  const t = text();

  const search = document.getElementById("search");
  if (search) search.placeholder = t.search;

  const sectionTitle = document.getElementById("sectionTitle");
  if (sectionTitle) sectionTitle.innerText = t.title;

  const modalAddBtn = document.getElementById("modalAddBtn");
  if (modalAddBtn) modalAddBtn.innerText = t.add;

  const navItems = document.querySelectorAll(".bottom .nav-item");

  if (navItems[0]) setNavText(navItems[0], t.home);
  if (navItems[1]) setNavText(navItems[1], t.cart);
  if (navItems[2]) setNavText(navItems[2], t.setting);
  if (navItems[3]) setNavText(navItems[3], t.account);
}

function setNavText(navItem, label) {
  let labelNode = navItem.querySelector(".nav-label");

  if (!labelNode) {
    labelNode = document.createElement("span");
    labelNode.className = "nav-label";
    navItem.appendChild(labelNode);
  }

  labelNode.innerText = label;
}

document.addEventListener("DOMContentLoaded", applyLang);
