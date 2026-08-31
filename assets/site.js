/* =================================================================
   CAVART — Comportements partagés par toutes les pages
   Menu, curseur, apparitions au défilement, modale de contact,
   formulaire, images manquantes.
   Aucune dépendance externe : ce fichier fonctionne toujours, même
   si le moteur 3D ou une ressource distante est indisponible.
   ================================================================= */
(function(){
  'use strict';

  var body = document.body;
  var isTouch = window.matchMedia('(hover: none)').matches || window.innerWidth <= 768;

  /* ---------------------------------------------------------------
     1. Images non encore fournies
     Une image absente s'efface et laisse voir le fond dégradé, au
     lieu d'afficher l'icône de fichier cassé du navigateur.
     --------------------------------------------------------------- */
  function markMissing(img){
    var holder = img.parentNode;
    while (holder && holder.className.indexOf('media') === -1) holder = holder.parentNode;
    if (holder) holder.classList.add('is-empty');
  }

  function markLoaded(img){
    img.classList.add('is-loaded');
    var holder = img.parentNode;
    while (holder && holder.className.indexOf('media') === -1) holder = holder.parentNode;
    if (holder) holder.classList.remove('is-empty');
  }

  function watchImages(){
    var imgs = document.querySelectorAll('.media img');
    for (var i = 0; i < imgs.length; i++){
      (function(img){
        if (img.complete){
          if (img.naturalWidth) markLoaded(img); else markMissing(img);
        } else {
          img.addEventListener('load',  function(){ markLoaded(img); });
          img.addEventListener('error', function(){ markMissing(img); });
        }
      })(imgs[i]);
    }
  }
  watchImages();

  /* ---------------------------------------------------------------
     2. Curseur double anneau (desktop uniquement)
     --------------------------------------------------------------- */
  if (!isTouch){
    var ring = document.getElementById('cursor-ring');
    var dot  = document.getElementById('cursor-dot');

    if (ring && dot){
      var mx = window.innerWidth / 2, my = window.innerHeight / 2;
      var rx = mx, ry = my;

      window.addEventListener('mousemove', function(e){
        mx = e.clientX; my = e.clientY;
        if (!body.classList.contains('has-cursor')) body.classList.add('has-cursor');
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      }, { passive:true });

      (function follow(){
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
        requestAnimationFrame(follow);
      })();

      var hoverables = document.querySelectorAll('a, button, input, select, textarea, [data-hover]');
      for (var h = 0; h < hoverables.length; h++){
        hoverables[h].addEventListener('mouseenter', function(){ body.classList.add('cursor-active'); });
        hoverables[h].addEventListener('mouseleave', function(){ body.classList.remove('cursor-active'); });
      }

      document.addEventListener('mouseleave', function(){ body.classList.remove('has-cursor'); });
      document.addEventListener('mouseenter', function(){ body.classList.add('has-cursor'); });
    }
  }

  /* ---------------------------------------------------------------
     3. Menu mobile
     --------------------------------------------------------------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav){
    burger.addEventListener('click', function(){
      var open = body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });

    var navLinks = nav.querySelectorAll('a');
    for (var n = 0; n < navLinks.length; n++){
      navLinks[n].addEventListener('click', function(){
        body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    }
  }

  /* ---------------------------------------------------------------
     4. En-tête : fond opaque après défilement
     --------------------------------------------------------------- */
  var header = document.getElementById('site-header');
  if (header){
    var solid = false;
    window.addEventListener('scroll', function(){
      var next = (window.scrollY || 0) > 60;
      if (next !== solid){
        solid = next;
        header.classList.toggle('is-solid', solid);
      }
    }, { passive:true });
  }

  /* ---------------------------------------------------------------
     5. Apparitions au défilement
     --------------------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry, i){
        if (entry.isIntersecting){
          var el = entry.target;
          setTimeout(function(){ el.classList.add('is-in'); }, Math.min(i * 90, 360));
          io.unobserve(el);
        }
      });
    }, { rootMargin:'0px 0px -12% 0px', threshold:0.12 });
    for (var r = 0; r < revealables.length; r++) io.observe(revealables[r]);
  } else {
    for (var r2 = 0; r2 < revealables.length; r2++) revealables[r2].classList.add('is-in');
  }

  /* ---------------------------------------------------------------
     6. Modale de contact
     --------------------------------------------------------------- */
  var modal = document.getElementById('modal');
  var lastFocus = null;

  function openModal(e){
    if (!modal) return;
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.remove('menu-open');
    body.style.overflow = 'hidden';
    var first = document.getElementById('f-nom');
    if (first) setTimeout(function(){ first.focus(); }, 420);
  }

  function closeModal(){
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  var openers = document.querySelectorAll('[data-open-modal]');
  for (var o = 0; o < openers.length; o++) openers[o].addEventListener('click', openModal);

  var closer = document.getElementById('modal-close');
  if (closer) closer.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (modal && modal.classList.contains('is-open')) closeModal();
      if (body.classList.contains('menu-open')){
        body.classList.remove('menu-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      }
    }
    if (e.key === 'Tab' && modal && modal.classList.contains('is-open')){
      var f = modal.querySelectorAll('button, input, select, textarea, a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------------------------------------------------------
     7. Formulaire de contact
     Renseignez data-endpoint sur le <form> pour un envoi serveur.
     Sans endpoint, le message est préparé dans la messagerie.
     --------------------------------------------------------------- */
  /* Plusieurs formulaires peuvent coexister sur une même page (la modale
     et le formulaire de la page Contact) : on les traite tous, chacun avec
     son propre message d'état. */
  var forms = document.querySelectorAll('form[data-contact]');
  for (var fi = 0; fi < forms.length; fi++) wireForm(forms[fi]);

  function wireForm(form){
    var status = form.querySelector('.form-status');
    var endpoint = form.getAttribute('data-endpoint') || '';
    var mailTo = form.getAttribute('data-mailto') || 'contact@cavart.com';
    // Seul le formulaire de la modale doit la refermer après envoi
    var inModal = !!(modal && modal.contains(form));
    function dismiss(){ if (inModal) closeModal(); }

    form.addEventListener('submit', function(e){
      e.preventDefault();

      var data = {};
      new FormData(form).forEach(function(v, k){ data[k] = v; });

      if (data.societe_web){ dismiss(); return; }           // piège anti-spam

      if (!data.nom || !data.email || !data.message){
        status.textContent = 'Merci de renseigner votre nom, votre email et votre message.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)){
        status.textContent = 'L’adresse email ne semble pas valide.';
        return;
      }

      status.textContent = 'Envoi en cours…';

      function fallbackToMail(){
        var subject = encodeURIComponent('Cavart — ' + (data.motif || 'Contact') + ' — ' + data.nom);
        var lines = [
          'Nom : ' + data.nom,
          'Email : ' + data.email,
          'Téléphone : ' + (data.telephone || '—'),
          'Motif : ' + (data.motif || '—'),
          '',
          data.message
        ].join('\n');
        window.location.href = 'mailto:' + mailTo + '?subject=' + subject + '&body=' + encodeURIComponent(lines);
        status.textContent = 'Message préparé dans votre messagerie.';
      }

      if (!endpoint){ fallbackToMail(); return; }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
        body: JSON.stringify(data)
      }).then(function(res){
        if (!res.ok) throw new Error('network');
        status.textContent = 'Message reçu. Le studio vous répondra personnellement.';
        form.reset();
        setTimeout(dismiss, 2600);
      }).catch(function(){
        status.textContent = 'Envoi impossible pour le moment — ouverture de votre messagerie.';
        fallbackToMail();
      });
    });
  }

  /* ---------------------------------------------------------------
     8. Année courante dans le pied de page
     --------------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

})();
