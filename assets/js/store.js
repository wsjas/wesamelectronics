import { db } from './firebase-config.js';
import { toast } from './utils.js';
import { DEFAULT_CATEGORIES } from './categories-data.js';
import {
  collection, getDocs, query, where, orderBy, limit, addDoc
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const $ = (id)=>document.getElementById(id);

function catCard(c){
  const href = `categories.html?cat=${encodeURIComponent(c.slug)}`;
  return `
  <a class="card" href="${href}">
    <div class="pad cat">
      <div class="ic">${c.icon || '🧩'}</div>
      <div>
        <div style="font-weight:900">${c.name_ar || c.name || c.slug}</div>
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

  // Try seeding; if rules block writes, we just continue silently
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
  const cats = catsSnap.docs.map(d=>({id:d.id, ...d.data()}));
  const grid = $('categoriesGrid');
  if(grid){
    grid.innerHTML = cats.map(catCard).join('');
  }
  const stat = $('statCategories');
  if(stat) stat.textContent = String(cats.length || 0);
  return cats;
}

async function loadOffers(){
  const grid = $('offersGrid');
  if(!grid) return;

  // Offer = old_price_jod exists and is greater than price
  const snap = await getDocs(query(collection(db,'products'), orderBy('createdAt','desc'), limit(12)));
  const all = snap.docs.map(d=>({id:d.id, ...d.data()}));
  const offers = all.filter(p => Number(p.old_price_jod||0) > Number(p.price_jod||0) && Number(p.price_jod||0) > 0);
  grid.innerHTML = offers.slice(0,8).map(prodCard).join('') || `<div class="muted" style="padding:12px">لا يوجد عروض حالياً</div>`;
}

async function loadLatest(){
  const grid = $('latestGrid');
  if(!grid) return;
  const snap = await getDocs(query(collection(db,'products'), orderBy('createdAt','desc'), limit(10)));
  const items = snap.docs.map(d=>({id:d.id, ...d.data()}));
  grid.innerHTML = items.map(prodCard).join('') || `<div class="muted" style="padding:12px">لا يوجد منتجات بعد</div>`;
}

function setupSearch(){
  const inp = $('searchInput');
  const btn = $('searchBtn');
  if(!inp || !btn) return;

  // If i18n has placeholders
  inp.setAttribute('data-i18n-placeholder', 'searchPlaceholder');

  const go = ()=>{
    const q = (inp.value||'').trim();
    if(!q) return toast(window.WE_I18N?.getLang?.()==='en' ? 'Type something to search' : 'اكتب كلمة للبحث');
    location.href = `categories.html?q=${encodeURIComponent(q)}`;
  };
  btn.addEventListener('click', go);
  inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter') go(); });
}

loadCategories();
loadOffers();
loadLatest();
setupSearch();
