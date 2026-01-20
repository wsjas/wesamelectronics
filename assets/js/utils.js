export function moneyJOD(n){
  const x = Number(n || 0);
  return `${x.toFixed(2)} JOD`;
}

export function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(()=>{ el.style.display='none'; }, 2200);
}

export function qs(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
