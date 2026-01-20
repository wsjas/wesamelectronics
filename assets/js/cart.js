import { toast, moneyJOD } from './utils.js';

const KEY = 'we_cart_v1';

function loadCart(){
  try{ return JSON.parse(localStorage.getItem(KEY) || '[]'); }catch{ return []; }
}
function saveCart(items){
  localStorage.setItem(KEY, JSON.stringify(items));
  updateBadge();
}

function updateBadge(){
  const count = loadCart().reduce((a,i)=>a + (i.qty||0), 0);
  const el = document.getElementById('cartCount');
  if(el) el.textContent = String(count);
}

function addToCart(p){
  const items = loadCart();
  const idx = items.findIndex(x=>x.id===p.id);
  if(idx>=0) items[idx].qty += 1;
  else items.push({
    id: p.id,
    name_ar: p.name_ar || '',
    name_en: p.name_en || '',
    price_jod: Number(p.price_jod || 0),
    image: (p.image_urls && p.image_urls[0]) ? p.image_urls[0] : '',
    sku: p.sku || '',
    qty: 1
  });
  saveCart(items);
  toast((window.WE_I18N?.getLang?.() === 'en') ? 'Added to cart' : 'تمت الإضافة للسلة');
}

function removeFromCart(id){
  const items = loadCart().filter(x=>x.id!==id);
  saveCart(items);
}

function setQty(id, qty){
  const items = loadCart();
  const it = items.find(x=>x.id===id);
  if(!it) return;
  it.qty = Math.max(1, Number(qty||1));
  saveCart(items);
}

function clearCart(){
  saveCart([]);
}

function cartTotals(shippingJOD){
  const items = loadCart();
  const subtotal = items.reduce((a,i)=>a + i.price_jod*i.qty, 0);
  const shipping = Number(shippingJOD || 0);
  return { subtotal, shipping, total: subtotal + shipping };
}

window.WE_CART = { loadCart, saveCart, addToCart, removeFromCart, setQty, clearCart, cartTotals, updateBadge, moneyJOD };

updateBadge();
