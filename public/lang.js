const langData = {
  en: {
    search: "🔍 Search products...",
    add: "Add to Cart",
    home: "Home",
    cart: "Cart"
  },
  kh: {
    search: "🔍 ស្វែងរកទំនិញ...",
    add: "ដាក់ក្នុងកន្ត្រក",
    home: "ទំព័រដើម",
    cart: "កន្ត្រក"
  }
};

function setLang(lang){
  localStorage.setItem("lang", lang);
  applyLang();
}

function applyLang(){
  const lang = localStorage.getItem("lang") || "en";
  const t = langData[lang];

  document.getElementById("search").placeholder = t.search;

  document.querySelector(".bottom div:nth-child(1)").innerText = t.home;
  document.querySelector(".bottom div:nth-child(2)").innerText = t.cart;

  document.querySelectorAll(".card button").forEach(btn=>{
    btn.innerText = t.add;
  });
}