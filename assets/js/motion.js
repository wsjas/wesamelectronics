// Calm scroll reveal (lightweight)
function addReveal(){
  const selectors = [
    '.section',
    '#categoriesGrid .card',
    '#offersGrid .card',
    '#latestGrid .card',
    '#productsGrid .card',
    '.grid .card'
  ];

  selectors.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>{
      el.classList.add('reveal');
    });
  });

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

addReveal();
