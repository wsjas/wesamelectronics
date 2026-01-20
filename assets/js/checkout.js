import { db } from './firebase-config.js';
import { toast, moneyJOD } from './utils.js';
import {
  collection, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const $ = (id)=>document.getElementById(id);

function renderCart(){
  const items = window.WE_CART.loadCart();
  const wrap = $('cartItems');
  const empty = $('empty');

  if(!items.length){
    wrap.innerHTML = '';
    empty.style.display = 'block';
    updateTotals();
    return;
  }
  empty.style.display = 'none';

  wrap.innerHTML = items.map(it=>`
    <div class="cart-item">
      <img src="${it.image || ''}" alt="">
      <div>
        <div style="font-weight:900">${it.name_ar || ''}</div>
        <div class="muted" style="font-size:12px">${it.name_en || ''}</div>
        <div class="muted" style="font-size:12px">${moneyJOD(it.price_jod)} • SKU: ${it.sku || '-'}</div>
        <div class="qty" style="margin-top:8px">
          <button class="btn ghost" data-dec="${it.id}">-</button>
          <div style="min-width:32px;text-align:center;font-weight:900">${it.qty}</div>
          <button class="btn ghost" data-inc="${it.id}">+</button>
          <button class="btn ghost" data-del="${it.id}">حذف</button>
        </div>
      </div>
      <div style="font-weight:900">${moneyJOD(it.price_jod * it.qty)}</div>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-inc');
    const it = items.find(x=>x.id===id);
    if(!it) return;
    window.WE_CART.setQty(id, it.qty+1);
    renderCart();
  }));
  wrap.querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-dec');
    const it = items.find(x=>x.id===id);
    if(!it) return;
    window.WE_CART.setQty(id, Math.max(1, it.qty-1));
    renderCart();
  }));
  wrap.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-del');
    window.WE_CART.removeFromCart(id);
    renderCart();
  }));

  updateTotals();
}

function calcShipping(){
  // Simple rule: Jordan 3 JOD, outside Jordan 8 JOD (can change later from settings)
  const country = ($('country')?.value || 'Jordan').trim().toLowerCase();
  if(country === 'jordan' || country === 'الأردن' || country === 'jo') return 3;
  return 8;
}

function updateTotals(){
  const ship = calcShipping();
  const t = window.WE_CART.cartTotals(ship);
  $('subtotal').textContent = moneyJOD(t.subtotal);
  $('shipping').textContent = moneyJOD(t.shipping);
  $('total').textContent = moneyJOD(t.total);
}

async function placeOrder(){
  const items = window.WE_CART.loadCart();
  if(!items.length) return toast('السلة فارغة');

  const customer_name = ($('name').value||'').trim();
  const phone = ($('phone').value||'').trim();
  const country = ($('country').value||'').trim();
  const city = ($('city').value||'').trim();
  const address = ($('address').value||'').trim();
  const payment_method = ($('payment').value||'COD').trim();

  if(!customer_name || !phone || !country || !city || !address){
    return toast('أكمل البيانات المطلوبة');
  }

  const shipping = calcShipping();
  const totals = window.WE_CART.cartTotals(shipping);

  const order = {
    customer_name,
    phone,
    country,
    city,
    address,
    payment_method,
    items: items.map(i=>({
      product_id: i.id,
      sku: i.sku,
      name_ar: i.name_ar,
      name_en: i.name_en,
      qty: i.qty,
      price: i.price_jod
    })),
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
    status: 'NEW',
    created_at: serverTimestamp()
  };

  const btn = $('placeOrderBtn');
  btn.disabled = true;
  try{
    await addDoc(collection(db,'orders'), order);
    window.WE_CART.clearCart();
    renderCart();
    toast('تم إرسال الطلب ✅');
  }catch(e){
    console.error(e);
    toast('فشل إرسال الطلب (تحقق من Rules)');
  }finally{
    btn.disabled = false;
  }
}

$('clearBtn')?.addEventListener('click', ()=>{ window.WE_CART.clearCart(); renderCart(); });
$('placeOrderBtn')?.addEventListener('click', placeOrder);
['country'].forEach(id=>$(id)?.addEventListener('input', updateTotals));

renderCart();
updateTotals();
