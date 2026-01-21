// Simple scroll reveal
const targets = [
  '#categoriesGrid .card',
  '#offersGrid .card',
  '#latestGrid .card',
  '#productsGrid .card',
  '.section',
  '.card'
];

function markReveal(){
  targets.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>{
      el.classList.add('reveal');
    });
  });
}

function runObserver(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

markReveal();
runObserver();
