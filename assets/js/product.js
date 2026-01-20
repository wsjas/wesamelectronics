import { db } from './firebase-config.js';
import { toast } from './utils.js';
import {
  doc, getDoc, collection, getDocs, query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const $ = (id)=>document.getElementById(id);

function qs(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

function prodCard(p){
  const href = `product.html?id=${encodeURIComponent(p.id)}`;
  const img = (p.image_urls && p.image_urls[0]) ? p.image_urls[0] : '';
  return `
  <a class="card" href="${href}">
    <div class="pad product">
      <div class="pimg">${img ? `<img src="${img}" alt="">` : `<div class="ph">${p.name_ar?.[0]||'W'}</div>`}</div>
      <div class="ptitle">${p.name_ar || p.name_en || '—'}</div>
      <div class="pprice"><span class="price">${Number(p.price_jod||0).toFixed(2)} JOD</span></div>
    </div>
  </a>`;
}

function render(p){
  $('pName').textContent = p.name_ar || p.name_en || '—';
  $('pNameEn').textContent = p.name_en || '';
  $('pSku').textContent = p.sku ? `SKU: ${p.sku}` : '';
  $('pStock').textContent = (p.stock === 0) ? 'غير متوفر' : (p.stock ? `متوفر: ${p.stock}` : '');

  const price = Number(p.price_jod || 0);
  const old = Number(p.old_price_jod || 0);
  $('pPrice').textContent = `${price.toFixed(2)} JOD`;
  const oldEl = $('pOld');
  if(oldEl){
    if(old > price && old > 0){
      oldEl.textContent = `${old.toFixed(2)} JOD`;
      oldEl.style.display = 'inline';
      $('badge').style.display = 'inline-block';
      $('badge').textContent = 'عرض';
    }else{
      oldEl.style.display = 'none';
      $('badge').style.display = 'none';
    }
  }

  const imgs = (p.image_urls || []).filter(Boolean);
  const main = $('mainImg');
  const thumbs = $('thumbs');

  if(main){
    if(imgs.length) main.innerHTML = `<img src="${imgs[0]}" alt="">`;
    else main.innerHTML = `<div class="ph big">${(p.name_ar||'W')[0]}</div>`;
  }
  if(thumbs){
    thumbs.innerHTML = imgs.map((u,i)=>`
      <button class="thumb" data-i="${i}"><img src="${u}" alt=""></button>
    `).join('');
    thumbs.querySelectorAll('.thumb').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const i = Number(btn.getAttribute('data-i')||0);
        if(main) main.innerHTML = `<img src="${imgs[i]}" alt="">`;
      });
    });
  }

  $('pDesc').textContent = p.description_ar || '';
  $('pDescEn').textContent = p.description_en || '';

  $('addBtn')?.addEventListener('click', ()=>{
    window.WE_CART?.addToCart?.(p);
  });

  // WhatsApp
  const wa = $('waBtn');
  if(wa){
    const msg = encodeURIComponent(`مرحبا، أريد هذا المنتج: ${p.name_ar || p.name_en} | السعر: ${price.toFixed(2)} JOD`);
    wa.href = `https://wa.me/962790781206?text=${msg}`;
  }
}

async function loadSimilar(category_slug, currentId){
  const grid = $('similarGrid');
  if(!grid || !category_slug) return;
  const snap = await getDocs(query(collection(db,'products'), where('category_slug','==',category_slug), orderBy('createdAt','desc'), limit(8)));
  const items = snap.docs.map(d=>({id:d.id, ...d.data()})).filter(x=>x.id!==currentId).slice(0,4);
  grid.innerHTML = items.map(prodCard).join('');
}

(async function init(){
  const id = qs('id');
  if(!id){
    toast('لا يوجد منتج');
    return;
  }
  try{
    const ref = doc(db, 'products', id);
    const snap = await getDoc(ref);
    if(!snap.exists()){
      toast('المنتج غير موجود');
      return;
    }
    const p = { id: snap.id, ...snap.data() };
    render(p);
    await loadSimilar(p.category_slug, p.id);
  }catch(e){
    console.error(e);
    toast('خطأ في تحميل المنتج');
  }
})();
