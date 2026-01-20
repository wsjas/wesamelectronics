const STRINGS = {
  ar: {
    home: "الرئيسية",
    categories: "الأقسام",
    allCategories: "جميع الأقسام",
    products: "منتج",
    support: "دعم",
    topCategories: "أهم الأقسام",
    seeAll: "عرض الكل",
    offers: "العروض",
    offersHint: "منتجات عليها سعر قبل الخصم",
    latest: "الأحدث",
    latestHint: "آخر المنتجات المُضافة",
    search: "بحث",
    searchPlaceholder: "ابحث عن منتج، رسيفر، ريموت...",
    cart: "السلة",
    checkout: "إتمام الطلب",
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    qty: "الكمية",
    price: "السعر",
    total: "الإجمالي",
    emptyCart: "سلتك فارغة",
    noProducts: "لا توجد منتجات",
    back: "رجوع",
    admin: "لوحة الأدمن",
    orders: "الطلبات",
    settings: "الإعدادات",
    language: "اللغة",
    similar: "منتجات مشابهة",
    viewCart: "عرض السلة",
    continueShopping: "متابعة التسوق"
  },
  en: {
    home: "Home",
    categories: "Categories",
    allCategories: "All Categories",
    products: "Products",
    support: "Support",
    topCategories: "Top Categories",
    seeAll: "See all",
    offers: "Offers",
    offersHint: "Products with compare-at price",
    latest: "Latest",
    latestHint: "Newest added products",
    search: "Search",
    searchPlaceholder: "Search products, receiver, remote...",
    cart: "Cart",
    checkout: "Checkout",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    qty: "Qty",
    price: "Price",
    total: "Total",
    emptyCart: "Your cart is empty",
    noProducts: "No products",
    back: "Back",
    admin: "Admin Panel",
    orders: "Orders",
    settings: "Settings",
    language: "Language",
    similar: "Similar products",
    viewCart: "View cart",
    continueShopping: "Continue shopping"
  }
};

const KEY = "we_lang_v1";

export function getLang(){
  const v = localStorage.getItem(KEY);
  if(v === "en" || v === "ar") return v;
  return document.documentElement.lang === "en" ? "en" : "ar";
}

export function setLang(lang){
  localStorage.setItem(KEY, lang);
  applyLang(lang);
}

export function t(key){
  const lang = getLang();
  return (STRINGS[lang] && STRINGS[lang][key]) || (STRINGS.ar[key]) || key;
}

export function applyLang(lang = getLang()){
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    el.textContent = t(k);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    const k = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(k));
  });
}

window.WE_I18N = { getLang, setLang, t, applyLang };

applyLang();
