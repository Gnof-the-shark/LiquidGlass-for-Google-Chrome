// iOS 26 Liquid Glass — v7
// Fix décalage : feImage remplacé par feTurbulence radial (primitiveUnits="objectBoundingBox")
// Un seul SVG global, filtre centré sur l'élément via objectBoundingBox

function init() {
  chrome.storage.sync.get('enabled', (data) => {
    if (data.enabled) applyLiquidGlass();
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function applyLiquidGlass() {
  if (document.getElementById('ios26-lg')) return;

  // ── SVG GLOBAL avec primitiveUnits="objectBoundingBox" ──
  // Chaque primitive est exprimée en % de la boîte de l'élément filtré
  // → la distorsion suit toujours l'élément, peu importe sa position
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgDefs = document.createElementNS(svgNS, 'svg');
  svgDefs.style.cssText = 'position:fixed;top:-1px;left:-1px;width:1px;height:1px;pointer-events:none;overflow:hidden;';
  svgDefs.innerHTML = `<defs>

    <!-- ══ FILTRE BOUTON — distorsion bord radiale ══ -->
    <filter id="lg-btn"
      x="-15%" y="-15%" width="130%" height="130%"
      color-interpolation-filters="sRGB"
      primitiveUnits="objectBoundingBox">

      <!-- Gradient radial en coordonnées normalisées [0..1] -->
      <!-- Noir au centre (pas de déplacement) → blanc sur les bords (déplacement max) -->
      <feFlood flood-color="#000" result="BLACK"/>

      <!-- On simule la carte radiale avec un feComposite + feGaussianBlur -->
      <!-- Approche stable : masque radial via feImage d'un gradient inline -->
      <feFlood flood-color="white" result="WHITE"/>

      <!-- Masque radial : transparent au centre, opaque sur les bords -->
      <!-- On utilise feComposite avec une feGaussianBlur pour éroder le centre -->
      <feFlood flood-color="black" result="BG"/>

      <!-- Source alpha comme base du masque de forme -->
      <feComposite in="WHITE" in2="SourceAlpha" operator="in" result="SHAPE"/>

      <!-- Éroder fortement le centre → garde seulement les bords -->
      <feMorphology in="SHAPE" operator="erode" radius="0.35 0.35" result="ERODED"/>

      <!-- Anneau = original - érodé -->
      <feComposite in="SHAPE" in2="ERODED" operator="out" result="EDGE_RING"/>

      <!-- Flou doux de l'anneau pour une transition progressive -->
      <feGaussianBlur in="EDGE_RING" stdDeviation="0.04 0.04" result="EDGE_SOFT"/>

      <!-- Déplacement : uniquement les pixels de l'anneau de bord sont déplacés -->
      <feDisplacementMap
        in="SourceGraphic" in2="EDGE_SOFT"
        scale="-0.07"
        xChannelSelector="R" yChannelSelector="G"
        result="DISPLACED"/>

      <!-- Pas de flou — texte net -->
      <feColorMatrix type="saturate" values="1.2" in="DISPLACED"/>
    </filter>

    <!-- ══ FILTRE HOVER — légèrement plus intense ══ -->
    <filter id="lg-btn-hover"
      x="-15%" y="-15%" width="130%" height="130%"
      color-interpolation-filters="sRGB"
      primitiveUnits="objectBoundingBox">

      <feFlood flood-color="white" result="WHITE"/>
      <feComposite in="WHITE" in2="SourceAlpha" operator="in" result="SHAPE"/>
      <feMorphology in="SHAPE" operator="erode" radius="0.3 0.3" result="ERODED"/>
      <feComposite in="SHAPE" in2="ERODED" operator="out" result="EDGE_RING"/>
      <feGaussianBlur in="EDGE_RING" stdDeviation="0.05 0.05" result="EDGE_SOFT"/>
      <feDisplacementMap
        in="SourceGraphic" in2="EDGE_SOFT"
        scale="-0.11"
        xChannelSelector="R" yChannelSelector="G"
        result="DISPLACED"/>
      <feColorMatrix type="saturate" values="1.3" in="DISPLACED"/>
    </filter>

  </defs>`;
  document.body.appendChild(svgDefs);

  // ── CSS GLOBAL ──
  const style = document.createElement('style');
  style.id = 'ios26-lg';
  style.innerHTML = `
    body,input,textarea,select,button,label,span,p,h1,h2,h3,h4,h5,h6,a {
      font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",
        "Helvetica Neue",Helvetica,Arial,sans-serif !important;
      -webkit-font-smoothing:antialiased !important;
      letter-spacing:-0.01em !important;
    }

    /* ── BOUTONS ── */
    button:not([disabled]):not([class*="no-glass"]),
    [role="button"]:not([class*="no-glass"]) {
      position:relative !important;
      isolation:isolate !important;
      background:rgba(255,255,255,0.08) !important;
      border:none !important;
      border-radius:20px !important;
      backdrop-filter:blur(8px) saturate(160%) brightness(1.06) !important;
      -webkit-backdrop-filter:blur(8px) saturate(160%) brightness(1.06) !important;
      box-shadow:
        inset 0 1.5px 0 rgba(255,255,255,0.62),
        inset 0 -1px 0 rgba(0,0,0,0.1),
        inset 0.5px 0 0 rgba(255,255,255,0.16),
        inset -0.5px 0 0 rgba(255,255,255,0.16),
        0 0 0 0.5px rgba(255,255,255,0.14),
        0 6px 20px -4px rgba(0,0,0,0.2),
        0 2px 6px rgba(0,0,0,0.1) !important;
      /* Filtre centré sur l'élément grâce à objectBoundingBox */
      filter:url(#lg-btn) !important;
      transition:
        background .3s cubic-bezier(.2,0,0,1),
        box-shadow  .3s cubic-bezier(.2,0,0,1),
        transform   .36s cubic-bezier(.34,1.56,.64,1) !important;
      cursor:pointer !important;
      overflow:visible !important;
    }

    /* Specular highlight */
    button:not([disabled]):not([class*="no-glass"])::before,
    [role="button"]:not([class*="no-glass"])::before {
      content:"" !important;
      position:absolute !important; inset:0 !important;
      border-radius:inherit !important;
      background:linear-gradient(168deg,
        rgba(255,255,255,0.4) 0%,
        rgba(255,255,255,0.1) 30%,
        transparent 58%) !important;
      pointer-events:none !important; z-index:0 !important;
    }

    /* Bordure verre dégradée */
    button:not([disabled]):not([class*="no-glass"])::after,
    [role="button"]:not([class*="no-glass"])::after {
      content:"" !important;
      position:absolute !important; inset:0 !important;
      border-radius:inherit !important;
      border:1px solid transparent !important;
      background:linear-gradient(145deg,
        rgba(255,255,255,0.55) 0%,
        rgba(255,255,255,0.05) 45%,
        rgba(255,255,255,0.2) 100%) border-box !important;
      -webkit-mask:linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0) border-box !important;
      -webkit-mask-composite:destination-out !important;
      mask-composite:exclude !important;
      pointer-events:none !important; z-index:1 !important;
    }

    button:not([disabled]):not([class*="no-glass"]):hover,
    [role="button"]:not([class*="no-glass"]):hover {
      background:rgba(255,255,255,0.16) !important;
      box-shadow:
        inset 0 2px 0 rgba(255,255,255,0.78),
        inset 0 -1px 0 rgba(0,0,0,0.08),
        0 0 0 0.5px rgba(255,255,255,0.28),
        0 12px 28px -6px rgba(0,0,0,0.26),
        0 4px 10px rgba(0,0,0,0.14) !important;
      filter:url(#lg-btn-hover) !important;
      transform:translateY(-2px) scale(1.04) !important;
    }

    button:not([disabled]):not([class*="no-glass"]):active,
    [role="button"]:not([class*="no-glass"]):active {
      transform:translateY(1px) scale(0.97) !important;
      background:rgba(255,255,255,0.04) !important;
      transition:all .08s ease !important;
    }

    /* ── ICÔNES ── */
    button svg,[role="button"] svg,button>svg,[role="button"]>svg {
      filter:saturate(1.9) brightness(1.18) drop-shadow(0 1px 3px rgba(0,0,0,0.22)) !important;
      opacity:.88 !important; position:relative !important; z-index:2 !important;
      transition:filter .3s ease,transform .36s cubic-bezier(.34,1.56,.64,1) !important;
    }
    button:hover svg,[role="button"]:hover svg {
      filter:saturate(2.5) brightness(1.4)
        drop-shadow(0 0 8px currentColor)
        drop-shadow(0 0 3px rgba(255,255,255,0.4)) !important;
      opacity:1 !important; transform:scale(1.12) !important;
    }
    button i,[role="button"] i,
    button .material-icons,[role="button"] .material-icons,
    button .material-symbols-outlined,[role="button"] .material-symbols-outlined {
      filter:saturate(1.7) brightness(1.2) !important;
      opacity:.88 !important; position:relative !important; z-index:2 !important;
      transition:filter .3s ease,transform .36s cubic-bezier(.34,1.56,.64,1) !important;
    }
    button:hover i,[role="button"]:hover i,
    button:hover .material-icons,[role="button"]:hover .material-icons,
    button:hover .material-symbols-outlined,[role="button"]:hover .material-symbols-outlined {
      filter:saturate(2.4) brightness(1.45) !important;
      opacity:1 !important; transform:scale(1.1) !important;
      text-shadow:0 0 10px currentColor !important;
    }
    button img,[role="button"] img {
      filter:saturate(1.6) brightness(1.1) !important; opacity:.88 !important;
      position:relative !important; z-index:2 !important;
      transition:filter .3s ease,transform .36s cubic-bezier(.34,1.56,.64,1) !important;
    }
    button:hover img,[role="button"]:hover img {
      filter:saturate(2.2) brightness(1.3) drop-shadow(0 0 6px rgba(255,255,255,0.4)) !important;
      opacity:1 !important; transform:scale(1.1) !important;
    }
    button span,[role="button"] span { position:relative !important; z-index:2 !important; }

    /* ── INPUTS ── */
    input[type="text"],input[type="search"],input[type="email"],
    input[type="password"],input[type="url"],textarea,[contenteditable="true"] {
      background:rgba(255,255,255,0.055) !important;
      backdrop-filter:blur(16px) saturate(180%) !important;
      -webkit-backdrop-filter:blur(16px) saturate(180%) !important;
      border:1px solid rgba(255,255,255,0.1) !important;
      border-radius:14px !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 4px 14px rgba(0,0,0,0.1) !important;
      transition:all .28s !important;
    }
    input:focus,textarea:focus,[contenteditable]:focus {
      background:rgba(255,255,255,0.1) !important;
      border-color:rgba(255,255,255,0.28) !important;
      box-shadow:inset 0 1.5px 0 rgba(255,255,255,0.32),0 0 0 3px rgba(255,255,255,0.07) !important;
      outline:none !important;
    }

    /* ── NAV ── */
    nav,header,[role="navigation"],
    [class*="topbar"],[class*="toolbar"],[class*="appbar"],[class*="navbar"] {
      background:rgba(255,255,255,0.04) !important;
      backdrop-filter:blur(28px) saturate(200%) brightness(1.06) !important;
      -webkit-backdrop-filter:blur(28px) saturate(200%) brightness(1.06) !important;
      border-bottom:1px solid rgba(255,255,255,0.07) !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.13),0 1px 24px rgba(0,0,0,0.1) !important;
    }

    /* ── LIENS ── */
    a:not([role="button"]):not([class*="btn"]) {
      border-radius:6px !important; padding:1px 3px !important;
      transition:background .22s !important;
    }
    a:not([role="button"]):not([class*="btn"]):hover { background:rgba(255,255,255,0.07) !important; }

    /* ── CURSEUR ── */
    #lg-glow {
      position:fixed;pointer-events:none;z-index:2147483646;
      width:320px;height:320px;border-radius:50%;
      transform:translate(-50%,-50%);
      background:radial-gradient(ellipse,rgba(255,255,255,0.022) 0%,transparent 70%);
      mix-blend-mode:screen;
    }
    #lg-grain {
      position:fixed;inset:0;pointer-events:none;z-index:2147483645;
      opacity:0.02;mix-blend-mode:overlay;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
      background-size:160px 160px;
    }
  `;
  document.head.appendChild(style);

  // Curseur lumineux
  const glow  = document.createElement('div'); glow.id  = 'lg-glow';  document.body.appendChild(glow);
  const grain = document.createElement('div'); grain.id = 'lg-grain'; document.body.appendChild(grain);
  let tx=-1000,ty=-1000,cx=-1000,cy=-1000;
  window.addEventListener('mousemove', e => { tx=e.clientX; ty=e.clientY; }, { passive:true });
  (function loop(){
    cx+=(tx-cx)*.07; cy+=(ty-cy)*.07;
    glow.style.left=cx+'px'; glow.style.top=cy+'px';
    requestAnimationFrame(loop);
  })();
}
