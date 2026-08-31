/* =================================================================
   CAVART — Pilote de la séquence d'ouverture (page d'accueil)

   Ce fichier n'a AUCUNE dépendance externe. Il gère le défilement,
   les textes, les barres d'avancement et l'écran de chargement.
   Le moteur 3D (scene.js) vient s'y brancher s'il se charge — sinon
   la séquence continue de fonctionner sans lui, conformément à la
   règle « ne jamais bloquer l'accès au contenu derrière une
   animation ».
   ================================================================= */
(function(){
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------- Chargement --------------------------- */
  var loader = document.getElementById('loader');
  var bar    = document.getElementById('load-bar');
  var pct    = document.getElementById('load-pct');
  var done   = false;

  window.__cavartLoader = {
    progress: function(v){
      if (done || !bar) return;
      var n = Math.round(Math.max(0, Math.min(1, v)) * 100);
      bar.style.width = n + '%';
      pct.textContent = (n < 10 ? '0' : '') + n;
    },
    reveal: function(){
      if (done) return;
      done = true;
      if (bar){ bar.style.width = '100%'; pct.textContent = '100'; }
      setTimeout(function(){
        if (loader) loader.classList.add('is-done');
        document.body.classList.add('is-loaded');
      }, 480);
    },
    isDone: function(){ return done; }
  };

  // Repli : au-delà de ce délai, le site s'ouvre sans le rendu 3D.
  setTimeout(function(){
    if (!done){
      document.body.classList.add('no-3d');
      window.__cavartLoader.reveal();
    }
  }, 7000);

  /* ------------------------ Pilote de scroll ------------------------ */
  var stage = document.getElementById('stage');
  if (!stage) return;

  var slides = [
    document.getElementById('slide-1'),
    document.getElementById('slide-2'),
    document.getElementById('slide-3'),
    document.getElementById('slide-4')
  ];
  var dashes = [
    document.getElementById('dash-fill-1'),
    document.getElementById('dash-fill-2'),
    document.getElementById('dash-fill-3'),
    document.getElementById('dash-fill-4')
  ];
  var hud       = document.getElementById('hud');
  var counter   = document.getElementById('hud-counter');
  var header    = document.getElementById('site-header');
  var scrollCue = document.getElementById('scroll-cue');
  var frame     = document.getElementById('stage-frame');

  var shared = { p:0, velocity:0 };
  window.__cavart = shared;

  var targetScroll  = 0;   // progression brute 0 → 1
  var currentScroll = 0;   // progression lissée (inertie)
  var activeSlide   = -1;
  var lastTime      = performance.now();

  function computeTarget(){
    var total = stage.offsetHeight - window.innerHeight;
    var y = window.scrollY || window.pageYOffset || 0;
    targetScroll = total > 0 ? Math.max(0, Math.min(1, y / total)) : 0;
  }

  function syncOverlay(p){
    var seg = 1 / 4;
    var index = Math.min(3, Math.floor(p / seg));

    for (var i = 0; i < 4; i++){
      var fill = Math.max(0, Math.min(1, (p - i * seg) / seg));
      if (dashes[i]) dashes[i].style.transform = 'scaleX(' + fill.toFixed(4) + ')';
    }

    var local = (p - index * seg) / seg;
    // Le premier jalon est présent dès l'ouverture : le hero n'est jamais muet.
    var visible = (index === 0 ? true : local > 0.06) && local < 0.94;
    var key = visible ? index : -1;

    if (key !== activeSlide){
      for (var s = 0; s < slides.length; s++){
        if (slides[s]) slides[s].classList.toggle('is-active', s === key);
      }
      activeSlide = key;
    }

    if (counter) counter.textContent = ('0' + (index + 1)).slice(-2) + ' / 04';

    // Ces bascules suivent la position réelle, non la valeur lissée :
    // l'habillage disparaît dès qu'on quitte la séquence immersive.
    var past = targetScroll > 0.995;
    if (hud) hud.classList.toggle('is-hidden', past);
    if (frame) frame.classList.toggle('is-hidden', past);
    if (scrollCue) scrollCue.classList.toggle('is-hidden', targetScroll > 0.02);
    if (header) header.classList.toggle('is-solid', (window.scrollY || 0) > 60);
  }

  function loop(now){
    requestAnimationFrame(loop);
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    var previous = currentScroll;
    currentScroll += (targetScroll - currentScroll) * (reduced ? 1 : 0.075);

    shared.p = currentScroll;
    shared.velocity = Math.abs(currentScroll - previous) / Math.max(dt, 0.0001);

    syncOverlay(currentScroll);
  }

  window.addEventListener('scroll', computeTarget, { passive:true });
  window.addEventListener('resize', computeTarget, { passive:true });
  computeTarget();
  currentScroll = targetScroll;
  requestAnimationFrame(loop);

})();
