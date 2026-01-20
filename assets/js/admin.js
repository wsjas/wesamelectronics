
import { db, auth } from './firebase-config.js';
import { toast } from './utils.js';
import { DEFAULT_CATEGORIES } from './categories-data.js';

import {
  collection, getDocs, query, orderBy, limit,
  addDoc, doc, updateDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';

const $ = (id)=>document.getElementById(id);

let CATS = [];
let PRODS = [];
let CAT_EDIT_ID = null;
let PROD_EDIT_ID = null;

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}

function showLogin(show){
  $('loginCard') && ($('loginCard').style.display = show ? 'block' : 'none');
  $('adminArea') && ($('adminArea').style.display = show ? 'none' : 'block');
}

function setAuthState(txt){
  const el = $('authState');
  if(el) el.textContent = txt || '';
}

function openModal(id, open){
  const m = $(id);
  if(!m) return;
  m.setAttribute('aria-hidden', open ? 'false' : 'true');
  m.style.display = open ? 'block' : 'none';
}

function boolVal(v){
  return String(v).toLowerCase() === 'true';
}

/* =======================
   Categories
======================= */
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
  renderCats();
  fillCatSelect();
}

function renderCats(){
  const wrap = $('catsTable');
  if(!wrap) return;

  wrap.innerHTML = `
    <div class="thead">
      <div class="td">القسم</div>
      <div class="td">slug</div>
      <div class="td">ترتيب</div>
      <div class="td">حالة</div>
      <div class="td">إجراءات</div>
    </div>
    ${CATS.map(c=>`
      <div class="tr">
        <div class="td"><b>${escapeHtml(c.name_ar||'')}</b><div class="muted">${escapeHtml(c.name_en||'')}</div></div>
        <div class="td">${escapeHtml(c.slug||'')}</div>
        <div class="td">${escapeHtml(c.order ?? '')}</div>
        <div class="td">${(c.active === false || c.active === 'false') ? 'inactive' : 'active'}</div>
        <div class="td">
          <button class="btn sm" data-cat-act="edit" data-id="${c.id}">تعديل</button>
          <button class="btn sm danger" data-cat-act="del" data-id="${c.id}">حذف</button>
        </div>
      </div>
    `).join('') || `<div class="muted" style="padding:12px">لا يوجد أقسام</div>`}
  `;

  wrap.querySelectorAll('button[data-cat-act]').forEach(btn=>{
    const act = btn.getAttribute('data-cat-act');
    const id = btn.getAttribute('data-id');
    if(act === 'edit') btn.addEventListener('click', ()=>openCatEdit(id));
    if(act === 'del') btn.addEventListener('click', ()=>deleteCat(id));
  });
}

function fillCatSelect(){
  const sel = $('pCategory');
  const filter = $('prodCatFilter');
  const opts = CATS.map(c=>`<option value="${c.slug}">${c.name_ar}</option>`).join('');
  if(sel) sel.innerHTML = `<option value="">اختر القسم</option>` + opts;
  if(filter) filter.innerHTML = `<option value="">كل الأقسام</option>` + opts;
}

function resetCatForm(){
  CAT_EDIT_ID = null;
  $('catModalTitle') && ($('catModalTitle').textContent = 'إضافة قسم');
  ['catNameAr','catNameEn','catSlug','catIcon'].forEach(id=>$(id) && ($(id).value=''));
  $('catOrder') && ($('catOrder').value = '1');
  $('catActive') && ($('catActive').value = 'true');
}

function openCatEdit(id){
  const c = CATS.find(x=>x.id===id);
  if(!c) return;
  CAT_EDIT_ID = id;
  $('catModalTitle') && ($('catModalTitle').textContent = 'تعديل قسم');
  $('catNameAr').value = c.name_ar || '';
  $('catNameEn').value = c.name_en || '';
  $('catSlug').value = c.slug || '';
  $('catIcon').value = c.icon || '';
  $('catOrder').value = String(c.order ?? 1);
  $('catActive').value = String(c.active !== false);
  openModal('catModal', true);
}

async function saveCat(){
  const data = {
    name_ar: ($('catNameAr').value||'').trim(),
    name_en: ($('catNameEn').value||'').trim(),
    slug: ($('catSlug').value||'').trim(),
    icon: ($('catIcon').value||'').trim(),
    order: Number($('catOrder').value||1),
    active: boolVal($('catActive').value),
  };
  if(!data.name_ar || !data.slug){
    return toast('اسم القسم و slug مطلوبان');
  }

  try{
    if(CAT_EDIT_ID){
      await updateDoc(doc(db,'categories', CAT_EDIT_ID), data);
      const i = CATS.findIndex(x=>x.id===CAT_EDIT_ID);
      if(i>=0) CATS[i] = { ...CATS[i], ...data };
      toast('تم تعديل القسم');
    }else{
      const ref = await addDoc(collection(db,'categories'), data);
      CATS.push({ id: ref.id, ...data });
      CATS.sort((a,b)=>Number(a.order||0)-Number(b.order||0));
      toast('تمت إضافة القسم');
    }
    renderCats();
    fillCatSelect();
    openModal('catModal', false);
  }catch(e){
    console.error(e);
    toast('فشل حفظ القسم (راجع الصلاحيات)');
  }
}

async function deleteCat(id){
  if(!confirm('حذف القسم؟')) return;
  try{
    await deleteDoc(doc(db,'categories', id));
    CATS = CATS.filter(x=>x.id!==id);
    renderCats();
    fillCatSelect();
    toast('تم حذف القسم');
  }catch(e){
    console.error(e);
    toast('فشل حذف القسم (راجع الصلاحيات)');
  }
}

/* =======================
   Products
======================= */
async function loadProds(){
  const snap = await getDocs(query(collection(db,'products'), orderBy('createdAt','desc'), limit(500)));
  PRODS = snap.docs.map(d=>({id:d.id, ...d.data()}));
  renderProds();
}

function prodRow(p){
  return `
    <div class="tr">
      <div class="td"><b>${escapeHtml(p.name_ar||'')}</b><div class="muted">${escapeHtml(p.sku||'')}</div></div>
      <div class="td">${escapeHtml(p.category_slug||'')}</div>
      <div class="td">${Number(p.price_jod||0).toFixed(2)} JOD</div>
      <div class="td">${(p.active === false || p.active === 'false') ? 'inactive' : 'active'}</div>
      <div class="td">
        <button class="btn sm" data-prod-act="edit" data-id="${p.id}">تعديل</button>
        <button class="btn sm danger" data-prod-act="del" data-id="${p.id}">حذف</button>
      </div>
    </div>
  `;
}

function renderProds(){
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
      <div class="td">المنتج</div>
      <div class="td">القسم</div>
      <div class="td">السعر</div>
      <div class="td">الحالة</div>
      <div class="td">إجراءات</div>
    </div>
    ${items.map(prodRow).join('') || `<div class="muted" style="padding:12px">لا يوجد منتجات</div>`}
  `;

  wrap.querySelectorAll('button[data-prod-act]').forEach(btn=>{
    const act = btn.getAttribute('data-prod-act');
    const id = btn.getAttribute('data-id');
    if(act === 'edit') btn.addEventListener('click', ()=>openProdEdit(id));
    if(act === 'del') btn.addEventListener('click', ()=>deleteProd(id));
  });
}

function resetProdForm(){
  PROD_EDIT_ID = null;
  $('prodModalTitle') && ($('prodModalTitle').textContent = 'إضافة منتج');
  ['pNameAr','pNameEn','pSku','pSub','pDescAr','pDescEn','pImg1','pImg2'].forEach(id=>$(id) && ($(id).value=''));
  $('pPrice') && ($('pPrice').value = '');
  $('pCompare') && ($('pCompare').value = '');
  $('pCategory') && ($('pCategory').value = '');
  $('pStock') && ($('pStock').value = '');
  $('pActive') && ($('pActive').value = 'true');
  hidePreview();
}

function openProdEdit(id){
  const p = PRODS.find(x=>x.id===id);
  if(!p) return;
  PROD_EDIT_ID = id;
  $('prodModalTitle') && ($('prodModalTitle').textContent = 'تعديل منتج');
  $('pNameAr').value = p.name_ar || '';
  $('pNameEn').value = p.name_en || '';
  $('pSku').value = p.sku || '';
  $('pPrice').value = p.price_jod ?? '';
  $('pCompare').value = p.old_price_jod ?? '';
  $('pCategory').value = p.category_slug || '';
  $('pSub').value = p.subcategory || '';
  $('pStock').value = p.stock ?? '';
  $('pActive').value = String(p.active !== false);

  const imgs = (p.image_urls || []).filter(Boolean);
  $('pImg1').value = imgs[0] || '';
  $('pImg2').value = imgs[1] || '';

  $('pDescAr').value = p.description_ar || '';
  $('pDescEn').value = p.description_en || '';
  hidePreview();
  openModal('prodModal', true);
}

async function saveProd(){
  const img1 = ($('pImg1')?.value||'').trim();
  const img2 = ($('pImg2')?.value||'').trim();

  const data = {
    name_ar: ($('pNameAr').value||'').trim(),
    name_en: ($('pNameEn').value||'').trim(),
    sku: ($('pSku').value||'').trim(),
    price_jod: Number($('pPrice').value||0),
    old_price_jod: Number($('pCompare').value||0) || 0,
    category_slug: ($('pCategory').value||'').trim(),
    subcategory: ($('pSub').value||'').trim(),
    stock: Number($('pStock').value||0) || 0,
    active: boolVal($('pActive').value),
    image_urls: [img1, img2].filter(Boolean),
    description_ar: ($('pDescAr').value||'').trim(),
    description_en: ($('pDescEn').value||'').trim(),
  };

  if(!data.name_ar || !data.category_slug || !data.price_jod){
    return toast('الاسم والسعر والقسم مطلوبة');
  }

  try{
    if(PROD_EDIT_ID){
      await updateDoc(doc(db,'products', PROD_EDIT_ID), data);
      const i = PRODS.findIndex(x=>x.id===PROD_EDIT_ID);
      if(i>=0) PRODS[i] = { ...PRODS[i], ...data };
      toast('تم تعديل المنتج');
    }else{
      const ref = await addDoc(collection(db,'products'), { ...data, createdAt: serverTimestamp() });
      PRODS.unshift({ id: ref.id, ...data, createdAt: new Date() });
      toast('تمت إضافة المنتج');
    }
    renderProds();
    openModal('prodModal', false);
  }catch(e){
    console.error(e);
    toast('فشل حفظ المنتج (راجع الصلاحيات)');
  }
}

async function deleteProd(id){
  if(!confirm('حذف المنتج؟')) return;
  try{
    await deleteDoc(doc(db,'products', id));
    PRODS = PRODS.filter(x=>x.id!==id);
    renderProds();
    toast('تم حذف المنتج');
  }catch(e){
    console.error(e);
    toast('فشل حذف المنتج (راجع الصلاحيات)');
  }
}

/* =======================
   Orders
======================= */
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

/* =======================
   Image preview
======================= */
function hidePreview(){
  const box = $('imgPreview');
  if(box) box.style.display = 'none';
  if(box) box.innerHTML = '';
}

function previewImages(){
  const img1 = ($('pImg1')?.value||'').trim();
  const img2 = ($('pImg2')?.value||'').trim();
  const imgs = [img1, img2].filter(Boolean);
  const box = $('imgPreview');
  if(!box) return;
  if(!imgs.length){
    box.style.display = 'none';
    box.innerHTML = '';
    return toast('لا يوجد روابط صور');
  }
  box.style.display = 'flex';
  box.style.gap = '10px';
  box.innerHTML = imgs.map(u=>`<a href="${u}" target="_blank" rel="noopener"><img src="${u}" style="width:90px;height:90px;object-fit:cover;border-radius:12px"></a>`).join('');
}

/* =======================
   Bind UI
======================= */
function bindUI(){
  $('loginBtn')?.addEventListener('click', async ()=>{
    const email = ($('loginEmail').value||'').trim();
    const pass = ($('loginPass').value||'').trim();
    try{
      await signInWithEmailAndPassword(auth, email, pass);
      toast('تم تسجيل الدخول');
    }catch(e){
      console.error(e);
      toast('بيانات الدخول غير صحيحة');
    }
  });

  $('logoutBtn')?.addEventListener('click', async ()=>{
    await signOut(auth);
  });

  // Categories
  $('newCatBtn')?.addEventListener('click', ()=>{ resetCatForm(); openModal('catModal', true); });
  $('closeCat')?.addEventListener('click', ()=>openModal('catModal', false));
  $('saveCatBtn')?.addEventListener('click', ()=>saveCat());

  // Products
  $('newProdBtn')?.addEventListener('click', ()=>{ resetProdForm(); openModal('prodModal', true); });
  $('closeProd')?.addEventListener('click', ()=>openModal('prodModal', false));
  $('saveProdBtn')?.addEventListener('click', ()=>saveProd());

  $('previewImgBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); previewImages(); });

  $('prodSearch')?.addEventListener('input', ()=>renderProds());
  $('prodCatFilter')?.addEventListener('change', ()=>renderProds());

  $('refreshOrders')?.addEventListener('click', ()=>loadOrders());
}

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    showLogin(true);
    setAuthState('');
    return;
  }
  showLogin(false);
  setAuthState(user.email || user.uid);

  await loadCats();
  await loadProds();
  await loadOrders();
});

bindUI();
