import { db, auth } from './firebase-config.js';
import { toast } from './utils.js';
import { DEFAULT_CATEGORIES } from './categories-data.js';
import {
  collection, getDocs, query, where, orderBy, limit, addDoc, doc, updateDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';

const $ = (id)=>document.getElementById(id);

let CATS = [];
let PRODS = [];
let EDIT_ID = null;

function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function showLogin(show){
  $('loginCard').style.display = show ? 'block' : 'none';
  $('adminArea').style.display = show ? 'none' : 'block';
}

function prodRow(p){
  return `
  <div class="tr">
    <div class="td"><b>${escapeHtml(p.name_ar||'')}</b><div class="muted">${escapeHtml(p.sku||'')}</div></div>
    <div class="td">${escapeHtml(p.category_slug||'')}</div>
    <div class="td">${Number(p.price_jod||0).toFixed(2)} JOD</div>
    <div class="td">
      <button class="btn sm" data-act="edit" data-id="${p.id}">${window.WE_I18N?.getLang?.()==='en'?'Edit':'تعديل'}</button>
      <button class="btn sm danger" data-act="del" data-id="${p.id}">${window.WE_I18N?.getLang?.()==='en'?'Delete':'حذف'}</button>
    </div>
  </div>`;
}

function renderProducts(){
  const wrap = $('prodsTable');
  if(!wrap) return;

  const qtxt = ($('prodSearch')?.value||'').trim().toLowerCase();
  const cat = ($('prodCatFilter')?.value||'').trim();

  let items = PRODS.slice();
  if(cat) items = items.filter(p => (p.category_slug||'') === cat);
  if(qtxt){
    items = items.filter(p => [p.name_ar,p.name_en,p.sku].filter(Boolean).some(x=>String(x).toLowerCase().includes(qtxt)));
  }

  wrap.innerHTML = `
    <div class="thead">
      <div class="td">${window.WE_I18N?.getLang?.()==='en'?'Product':'المنتج'}</div>
      <div class="td">${window.WE_I18N?.getLang?.()==='en'?'Category':'القسم'}</div>
      <div class="td">${window.WE_I18N?.getLang?.()==='en'?'Price':'السعر'}</div>
      <div class="td">${window.WE_I18N?.getLang?.()==='en'?'Actions':'إجراءات'}</div>
    </div>
    ${items.map(prodRow).join('') || `<div class="muted" style="padding:12px">لا يوجد بيانات</div>`}
  `;

  wrap.querySelectorAll('button[data-act]').forEach(btn=>{
    const act = btn.getAttribute('data-act');
    const id = btn.getAttribute('data-id');
    if(act === 'edit') btn.addEventListener('click', ()=>openEdit(id));
    if(act === 'del') btn.addEventListener('click', ()=>delProd(id));
  });
}

function openModal(open){
  const m = $('prodModal');
  if(!m) return;
  m.setAttribute('aria-hidden', open ? 'false' : 'true');
  m.style.display = open ? 'block' : 'none';
}

function resetForm(){
  EDIT_ID = null;
  $('prodModalTitle').textContent = 'إضافة منتج';
  ['pNameAr','pNameEn','pSku','pPrice','pCompare','pImages','pVideo','pDescAr','pDescEn'].forEach(id=>{ if($(id)) $(id).value=''; });
  $('pCategory').value = '';
}

function fillCatsSelect(){
  const sel1 = $('pCategory');
  const sel2 = $('prodCatFilter');
  const base = `<option value="">${window.WE_I18N?.getLang?.()==='en'?'All categories':'كل الأقسام'}</option>`;
  const opts = CATS.map(c=>`<option value="${c.slug}">${c.name_ar}</option>`).join('');
  if(sel1) sel1.innerHTML = `<option value="">اختر القسم</option>` + opts;
  if(sel2) sel2.innerHTML = base + opts;
}

async function seedCatsIfEmpty(){
  const snap = await getDocs(collection(db,'categories'));
  if(!snap.empty) return;
  try{
    for(const c of DEFAULT_CATEGORIES){
      await addDoc(collection(db,'categories'), c);
    }
  }catch(e){
    console.warn('Seed categories blocked:', e);
  }
}

async function loadCats(){
  await seedCatsIfEmpty();
  const snap = await getDocs(query(collection(db,'categories'), orderBy('order','asc')));
  CATS = snap.docs.map(d=>({id:d.id, ...d.data()}));
  fillCatsSelect();
}

async function loadProds(){
  const snap = await getDocs(query(collection(db,'products'), orderBy('createdAt','desc'), limit(400)));
  PRODS = snap.docs.map(d=>({id:d.id, ...d.data()}));
  renderProducts();
}

async function loadOrders(){
  const wrap = $('ordersTable');
  if(!wrap) return;
  const snap = await getDocs(query(collection(db,'orders'), orderBy('createdAt','desc'), limit(200)));
  const orders = snap.docs.map(d=>({id:d.id, ...d.data()}));

  wrap.innerHTML = `
    <div class="thead">
      <div class="td">الاسم</div>
      <div class="td">الهاتف</div>
      <div class="td">الإجمالي</div>
      <div class="td">التاريخ</div>
    </div>
    ${orders.map(o=>`
      <div class="tr">
        <div class="td"><b>${escapeHtml(o.name||'')}</b><div class="muted">${escapeHtml(o.city||'')}</div></div>
        <div class="td">${escapeHtml(o.phone||'')}</div>
        <div class="td">${Number(o.total||0).toFixed(2)} JOD</div>
        <div class="td">${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : ''}</div>
      </div>
    `).join('') || `<div class="muted" style="padding:12px">لا يوجد طلبات بعد</div>`}
  `;
}

function openEdit(id){
  const p = PRODS.find(x=>x.id===id);
  if(!p) return;
  EDIT_ID = id;
  $('prodModalTitle').textContent = 'تعديل منتج';
  $('pNameAr').value = p.name_ar || '';
  $('pNameEn').value = p.name_en || '';
  $('pSku').value = p.sku || '';
  $('pPrice').value = p.price_jod ?? '';
  $('pCompare').value = p.old_price_jod ?? '';
  $('pCategory').value = p.category_slug || '';
  $('pImages').value = (p.image_urls||[]).join('\n');
  $('pVideo').value = p.video_url || '';
  $('pDescAr').value = p.description_ar || '';
  $('pDescEn').value = p.description_en || '';
  openModal(true);
}

async function delProd(id){
  if(!confirm('حذف المنتج؟')) return;
  try{
    await deleteDoc(doc(db,'products', id));
    PRODS = PRODS.filter(x=>x.id!==id);
    renderProducts();
    toast('تم الحذف');
  }catch(e){
    console.error(e);
    toast('فشل الحذف (راجع الصلاحيات)');
  }
}

async function saveProd(){
  const data = {
    name_ar: ($('pNameAr').value||'').trim(),
    name_en: ($('pNameEn').value||'').trim(),
    sku: ($('pSku').value||'').trim(),
    price_jod: Number($('pPrice').value||0),
    old_price_jod: Number($('pCompare').value||0) || 0,
    category_slug: ($('pCategory').value||'').trim(),
    image_urls: ($('pImages').value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),
    video_url: ($('pVideo').value||'').trim(),
    description_ar: ($('pDescAr').value||'').trim(),
    description_en: ($('pDescEn').value||'').trim(),
  };

  if(!data.name_ar || !data.price_jod || !data.category_slug){
    return toast('الاسم والسعر والقسم مطلوبة');
  }

  try{
    if(EDIT_ID){
      await updateDoc(doc(db,'products', EDIT_ID), { ...data });
      const i = PRODS.findIndex(x=>x.id===EDIT_ID);
      if(i>=0) PRODS[i] = { ...PRODS[i], ...data };
      toast('تم التعديل');
    }else{
      const ref = await addDoc(collection(db,'products'), { ...data, createdAt: serverTimestamp() });
      PRODS.unshift({ id: ref.id, ...data, createdAt: new Date() });
      toast('تمت الإضافة');
    }
    openModal(false);
    renderProducts();
  }catch(e){
    console.error(e);
    toast('فشل الحفظ (راجع الصلاحيات)');
  }
}

function bindUI(){
  $('loginBtn')?.addEventListener('click', async ()=>{
    const email = ($('loginEmail').value||'').trim();
    const pass = ($('loginPass').value||'').trim();
    try{
      await signInWithEmailAndPassword(auth, email, pass);
      toast('تم تسجيل الدخول');
    }catch(e){
      console.error(e);
      toast('فشل تسجيل الدخول');
    }
  });

  $('logoutBtn')?.addEventListener('click', async ()=>{
    await signOut(auth);
  });

  $('newProdBtn')?.addEventListener('click', ()=>{ resetForm(); openModal(true); });
  $('closeProd')?.addEventListener('click', ()=>openModal(false));
  $('saveProd')?.addEventListener('click', ()=>saveProd());

  $('prodSearch')?.addEventListener('input', ()=>renderProducts());
  $('prodCatFilter')?.addEventListener('change', ()=>renderProducts());
}

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    showLogin(true);
    return;
  }
  showLogin(false);
  await loadCats();
  await loadProds();
  await loadOrders();
});

bindUI();
