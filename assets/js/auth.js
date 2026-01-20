import { auth } from './firebase-config.js';
import { toast } from './utils.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';

const $ = (id)=>document.getElementById(id);

$('loginBtn')?.addEventListener('click', async ()=>{
  const email = ($('email').value||'').trim();
  const password = $('password').value||'';
  if(!email || !password) return toast('أدخل البريد وكلمة المرور');
  try{
    await signInWithEmailAndPassword(auth, email, password);
    toast('تم تسجيل الدخول ✅');
    setTimeout(()=>location.href='admin/index.html', 600);
  }catch(e){
    console.error(e);
    toast('فشل تسجيل الدخول');
  }
});
