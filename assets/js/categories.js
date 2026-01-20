import { db } from './firebase-config.js';
import { qs, toast } from './utils.js';
import { DEFAULT_CATEGORIES } from './categories-data.js';
import {
  collection, getDocs, query, where, orderBy, limit, addDoc
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const $ = (id)=>document.getElementById(id);

let ALL_PRODUCTS = [];
let ALL_CATEGORIES = [];
let CURRENT_CAT = '';

function catCard(c){
  const href = `categories.html?cat=${encodeURIComponent(c.slug)}`;
  return `
  <a class="card" href="${href}">
    <div class="pad cat">
      <div class="ic">${c.icon || '🧩'}</div>
      <div>
        <div style="font-weight:900">${c.name_ar || c.slug}</div>
        <div class="muted">${c.name_en || ''}</div>
      </div>
    </div>
  </a>`;
}

function prodCard(p){
  const href = `product.html?id=${encodeURIComponent(p.id)}`;
  const img = (p.image_urls && p.image_urls[0]) ? p.image_urls[0] : '';
  const old = Number(p.old_price_jod || 0);
  const price = Number(p.price_jod || 0);
  const hasOffer = old > price && old > 0;
  return `
  <a class="card" href="${href}">
    <div class="pad product">
      <div class="pimg">${img ? `<img src="${img}" alt="">` : `<div class="ph">${p.name_ar?.[0]||'W'}</div>`}</div>
      <div class="ptitle">${p.name_ar || p.name_en || '—'}</div>
      <div class="muted">${p.sku ? `SKU: ${p.sku}` : ''}</div>
      <div class="pprice">
        <span class="price">${price.toFixed(2)} JOD</span>
        ${hasOffer ? `<span class="old">${old.toFixed(2)} JOD</span>` : ''}
      </div>
    </div>
  </a>`;
}

async function seedCategoriesIfEmpty(){
  const snap = await getDocs(collection(db, 'categories'));
  if(!snap.empty) return;
  try{
    for(const c of DEFAULT_CATEGORIES){
      await addDoc(collection(db,'categories'), c);
    }
  }catch(e){
    console.warn('Seed categories blocked:', e);
  }
}

async function loadCategories(){
  await seedCategoriesIfEmpty();
  const catsSnap = await getDocs(query(collection(db,'categories'), orderBy('order','asc')));
  ALL_CATEGORIES = catsSnap.docs.map(d=>({id:d.id, ...d.data()}));

  const grid = $('categoriesGrid');
  if(grid){
    grid.innerHTML = ALL_CATEGORIES.map(catCard).join('');
  }
}

async function loadProducts(){
  const cat = (qs('cat') || '').trim();
  CURRENT_CAT = cat;

  if(cat){
    // Only products for category
    const snap = await getDocs(query(collection(db,'products'), where('category_slug','==',cat), orderBy('createdAt','desc'), limit(200)));
    ALL_PRODUCTS = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }else{
    const snap = await getDocs(query(collection(db,'products'), orderBy('createdAt','desc'), limit(200)));
    ALL_PRODUCTS = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }
}

function applyFilters(){
  const searchVal = ($('searchInput')?.value || qs('q') || '').trim().toLowerCase();
  const sort = ($('sortSel')?.value || 'new').trim();

  let items = ALL_PRODUCTS.slice();

  if(searchVal){
    items = items.filter(p => [p.name_ar,p.name_en,p.sku].filter(Boolean).some(x=>String(x).toLowerCase().includes(searchVal)));
  }

  if(sort === 'price_asc') items.sort((a,b)=>Number(a.price_jod||0)-Number(b.price_jod||0));
  if(sort === 'price_desc') items.sort((a,b)=>Number(b.price_jod||0)-Number(a.price_jod||0));
  if(sort === 'name') items.sort((a,b)=>String(a.name_ar||'').localeCompare(String(b.name_ar||''), 'ar'));

  const grid = $('productsGrid');
  const empty = $('emptyState');
  if(grid){
    grid.innerHTML = items.map(prodCard).join('');
  }
  if(empty){
    empty.style.display = items.length ? 'none' : 'block';
  }
}

function setup(){
  const s = $('searchInput');
  if(s){
    const q = qs('q');
    if(q) s.value = q;
    s.addEventListener('input', ()=>applyFilters());
  }
  $('sortSel')?.addEventListener('change', ()=>applyFilters());
}

(async function init(){
  try{
    await loadCategories();
    await loadProducts();
    setup();
    applyFilters();
  }catch(e){
    console.error(e);
    toast('حدث خطأ في تحميل البيانات');
  }
})();
