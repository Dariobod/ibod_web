document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     0. INICIALIZACIÓN DE LENIS (SCROLL SUAVE GLOBAL PARA RUEDA Y TÁCTIL)
     ========================================================================== */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.4, // Duración del deslizamiento inercial
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva de atenuación exponencial suave (easeOutExpo)
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1.0,
      smoothTouch: false, // Mantener scroll nativo en móviles para mayor compatibilidad táctil
      touchMultiplier: 2.0
    });

    // Ligar Lenis al loop del frame de animación del navegador
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ==========================================================================
     1. ANIMACIÓN DE ENTRADA AL HACER SCROLL (SCROLL REVEAL)
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Una vez que es visible, dejamos de observarlo para optimizar
        observer.unobserve(entry.target);
      }
    });
  };

  const revealObserver = new IntersectionObserver(revealCallback, {
    root: null,
    threshold: 0.1, // Se activa cuando el 10% del elemento entra en pantalla
    rootMargin: '0px 0px -50px 0px' // Se activa un poco antes de que entre
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });


  /* ==========================================================================
     2. MENÚ MÓVIL (TOGGLE OVERLAY)
     ========================================================================== */
  const menuToggle = document.querySelector('.menu-toggle');
  const menuClose = document.querySelector('.menu-close');
  const mobileMenu = document.querySelector('.mobile-menu-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  const openMobileMenu = () => {
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // Bloquea scroll detrás
  };

  const closeMobileMenu = () => {
    mobileMenu.classList.remove('active');
    document.body.style.overflow = ''; // Restaura scroll
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', openMobileMenu);
  }

  if (menuClose) {
    menuClose.addEventListener('click', closeMobileMenu);
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });


  /* ==========================================================================
     3. SLIDER ANTES / DESPUÉS (COLOR GRADING)
     ========================================================================== */
  const sliderWrapper = document.querySelector('.slider-wrapper');
  const imgBefore = document.querySelector('.img-before');
  const sliderLine = document.querySelector('.slider-line');
  const sliderHandle = document.querySelector('.slider-handle');

  if (sliderWrapper && imgBefore && sliderLine && sliderHandle) {
    let isDragging = false;

    const updateSlider = (clientX) => {
      const rect = sliderWrapper.getBoundingClientRect();
      const positionX = clientX - rect.left;
      let percentage = (positionX / rect.width) * 100;

      // Limitar el rango entre 0% y 100%
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;

      // Actualizar estilos del DOM
      imgBefore.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      sliderLine.style.left = `${percentage}%`;
      sliderHandle.style.left = `${percentage}%`;
    };

    // Eventos de Mouse y Táctiles
    const startDrag = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateSlider(clientX);
      e.preventDefault();
    };

    const drag = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateSlider(clientX);
    };

    const stopDrag = () => {
      isDragging = false;
    };

    // Registrar Eventos en el Handle
    sliderHandle.addEventListener('mousedown', startDrag);
    sliderHandle.addEventListener('touchstart', startDrag, { passive: false });

    // Registrar Eventos en el Wrapper para una navegación más fluida
    sliderWrapper.addEventListener('mousedown', startDrag);
    sliderWrapper.addEventListener('touchstart', startDrag, { passive: false });

    // Los eventos de movimiento y soltado se registran en window para no perder el foco si el mouse sale del contenedor
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  }


  /* ==========================================================================
     4. FILTROS DE PORTAFOLIO E INTEGRACIÓN CON GOOGLE APPS SCRIPT API
     ========================================================================== */
  // URL de tu Web App de Google Apps Script. 
  const API_URL = "https://script.google.com/macros/s/AKfycbyCvC_0rZkvu0mUtKRiaWlQvdnkXLmNCMMnVOg9Db9Gfx6ApcadwkSNA4KyXeWEVNVs8Q/exec?tipo=trabajos";

  let allTrabajos = [];

  // Función para extraer el ID del video de YouTube a partir de la URL
  function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp); 
    return (match && match[1].length === 11) ? match[1] : null;
  }

  // Generador de poster/thumbnail para URLs de Cloudinary
  function getCloudinaryPoster(url) {
    if (!url || typeof url !== 'string') return '';
    if (!/cloudinary\.com/i.test(url)) return '';
    try {
      return url
        .replace(/\/video\/upload\/(?:[^\/]+\/)?/, '/video/upload/so_0,f_jpg,q_auto/')
        .replace(/\.[a-z0-9]+$/i, '.jpg');
    } catch (e) {
      return '';
    }
  }

  // Función para detectar la fuente del video (YouTube, Cloudinary o archivo de video directo)
  function parseVideoSource(url) {
    if (!url) return { provider: 'unknown', url: '' };

    const ytId = getYouTubeId(url);
    if (ytId) {
      return {
        provider: 'youtube',
        ytId: ytId,
        url: url,
        thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
      };
    }

    const isCloudinary = /cloudinary\.com/i.test(url) || /\/video\/upload\//i.test(url);
    const isDirectVideo = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);

    if (isCloudinary || isDirectVideo || /^https?:\/\//i.test(url)) {
      const poster = isCloudinary ? getCloudinaryPoster(url) : '';
      return {
        provider: 'cloudinary',
        url: url,
        thumbnail: poster
      };
    }

    return { provider: 'unknown', url: url };
  }

  // Regla de formato: Formato vertical (9:16) si la categoría contiene "Reel" o "Short", o si la URL indica formato vertical / reel.
  function isVerticalVideo(url, category) {
    if (!category) category = '';
    const catTrimmed = category.trim().toLowerCase();
    const urlLower = (url || '').toLowerCase();
    const isShortOrReelUrl = /\/shorts\//i.test(urlLower) || /reel/i.test(urlLower) || /vertical/i.test(urlLower);
    return catTrimmed.startsWith('reel-') || catTrimmed.includes('reel') || catTrimmed.includes('short') || isShortOrReelUrl;
  }

  // Función para aplicar filtro a las tarjetas por categoría
  function filterCardsByCategory(filterValue) {
    if (!filterValue) return;
    const currentCards = document.querySelectorAll('.portfolio-card');
    currentCards.forEach(card => {
      const category = card.getAttribute('data-category') || '';

      if (category.toLowerCase() === filterValue.toLowerCase()) {
        card.style.display = 'flex';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 50);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  }

  // Renderizado dinámico de botones de filtro por categoría
  function renderFilterButtons(categories) {
    const filtersContainer = document.getElementById('portfolio-filters');
    if (!filtersContainer) return;

    filtersContainer.innerHTML = '';

    categories.forEach((cat, index) => {
      if (!cat) return;
      const btn = document.createElement('button');
      btn.className = `filter-btn ${index === 0 ? 'active' : ''}`;
      btn.setAttribute('data-filter', cat);
      btn.textContent = cat;
      filtersContainer.appendChild(btn);
    });

    setupFilterListeners();
  }

  // Escuchador dinámico para los botones de filtro
  function setupFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');
        filterCardsByCategory(filterValue);
      });
    });
  }

  // Función para renderizar las tarjetas (Cards) en el DOM (YouTube y Cloudinary/Video directo)
  function renderGrid(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">No se encontraron trabajos.</p>';
      return;
    }

    data.forEach(v => {
      const isVertical = isVerticalVideo(v.urlOriginal, v.category);
      const card = document.createElement('div');
      card.className = `portfolio-card reveal visible ${isVertical ? 'portfolio-card-vertical' : ''}`;
      card.setAttribute('data-category', v.category);

      let mediaHtml = '';
      let playBtnHtml = '';

      if (v.provider === 'cloudinary') {
        const posterAttr = v.thumbnail ? `poster="${v.thumbnail}"` : '';
        mediaHtml = `
          <video 
            src="${v.urlOriginal}" 
            ${posterAttr}
            class="portfolio-thumb-video" 
            autoplay 
            muted 
            loop 
            playsinline 
            webkit-playsinline
            preload="auto"
            aria-label="${v.title}">
          </video>`;
        playBtnHtml = `
          <button class="project-play-btn" data-video="${v.urlOriginal}" aria-label="Ver video">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </button>`;
      } else {
        mediaHtml = `
          <iframe 
            src="https://www.youtube-nocookie.com/embed/${v.ytId}?autoplay=1&mute=1&loop=1&playlist=${v.ytId}&controls=0&showinfo=0&rel=0&enablejsapi=1&playsinline=1&modestbranding=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3" 
            title="${v.title}" 
            class="portfolio-thumb-video" 
            frameborder="0" 
            allow="autoplay; encrypted-media; picture-in-picture" 
            allowfullscreen>
          </iframe>`;
        playBtnHtml = `
          <a href="${v.urlOriginal}" target="_blank" rel="noopener noreferrer" class="project-play-btn" aria-label="Ver video en YouTube">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </a>`;
      }
      
      card.innerHTML = `
        <div class="portfolio-thumbnail">
          ${mediaHtml}
          <div class="portfolio-thumb-overlay"></div>
          <span class="project-tag">${v.category}</span>
          ${playBtnHtml}
        </div>
        <div class="portfolio-info">
          <h4 class="project-creator">${v.title}</h4>
          <p class="project-desc">${v.desc}</p>
        </div>
      `;
      
      container.appendChild(card);

      // Si es un video HTML5 (Cloudinary / Directo), asegurar mute e inicialización por JS
      const videoEl = card.querySelector('video');
      if (videoEl) {
        videoEl.muted = true;
        videoEl.defaultMuted = true;
        videoEl.playsInline = true;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log('Autoplay silencioso diferido:', err);
          });
        }
      }

      card.style.cursor = 'pointer';

      card.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof openVideoModal === 'function') {
          openVideoModal({
            url: v.urlOriginal,
            title: v.title,
            desc: v.desc,
            category: v.category,
            provider: v.provider,
            ytId: v.ytId,
            isVertical: isVertical
          });
        }
      });

      const iframe = card.querySelector('iframe');
      if (iframe) {
        const disableCaptions = () => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: ['captions'] }), '*');
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setOption', args: ['captions', 'track', {}] }), '*');
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setOption', args: ['cc', 'track', {}] }), '*');
            }
          } catch (e) {}
        };

        iframe.addEventListener('load', () => {
          disableCaptions();
          setTimeout(disableCaptions, 400);
          setTimeout(disableCaptions, 1200);
          setTimeout(disableCaptions, 2500);
        });
      }
    });
  }

  // Renderizar esqueletos de carga grisados (Skeleton Loading)
  function renderSkeletons() {
    const container = document.getElementById('portfolio-grid');
    const filtersContainer = document.getElementById('portfolio-filters');

    if (filtersContainer) {
      filtersContainer.innerHTML = `
        <div class="skeleton skeleton-filter-btn"></div>
        <div class="skeleton skeleton-filter-btn"></div>
        <div class="skeleton skeleton-filter-btn"></div>
      `;
    }

    if (container) {
      let skeletonHtml = '';
      for (let i = 0; i < 6; i++) {
        skeletonHtml += `
          <div class="skeleton-card">
            <div class="skeleton skeleton-thumb">
              <div class="skeleton skeleton-tag"></div>
            </div>
            <div class="skeleton-info">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-desc"></div>
              <div class="skeleton skeleton-btn"></div>
            </div>
          </div>
        `;
      }
      container.innerHTML = skeletonHtml;
    }
  }

  // Función principal para cargar los trabajos (videos) desde Google Apps Script
  async function loadVideos() {
    const container = document.getElementById('portfolio-grid');
    if (!container) return;

    // Mostrar estado de carga grisado con efecto Shimmer mientras se espera la API
    renderSkeletons();

    if (!API_URL || API_URL.includes('URL_DE_TU_NUEVO_APP_SCRIPT_AQUI')) {
      console.log("API_URL no configurada aún en index.js. Mostrando trabajos por defecto.");
      return;
    }

    try {
      const response = await fetch(API_URL);
      const rawResponse = await response.json();
      const rawData = rawResponse.data || rawResponse; 

      if (!Array.isArray(rawData) || rawData.length === 0) {
        renderGrid([], 'portfolio-grid');
        return;
      }

      const videos = rawData.map(item => {
        const link = (item.link || item.url || '').trim();
        const parsed = parseVideoSource(link);
        const cat = (item.categoria || item.category || 'General').trim();
        return {
          title: item.titulo || item.title || 'Sin Título',
          desc: item.descripcion || item.desc || '',
          category: cat,
          urlOriginal: link,
          provider: parsed.provider,
          ytId: parsed.ytId || null,
          thumbnail: parsed.thumbnail || ''
        };
      }).filter(v => v.provider !== 'unknown');

      if (videos.length > 0) {
        allTrabajos = videos;
        // Obtener categorías únicas dinámicamente desde los datos de la planilla
        const uniqueCategories = [...new Set(videos.map(v => v.category))];
        renderFilterButtons(uniqueCategories);
        renderGrid(allTrabajos, 'portfolio-grid');
        if (uniqueCategories.length > 0) {
          filterCardsByCategory(uniqueCategories[0]);
        }
      } else {
        renderGrid([], 'portfolio-grid');
      }
    } catch (error) {
      console.error("Error al cargar trabajos desde API:", error);
      renderGrid([], 'portfolio-grid');
    }
  }

  // Iniciar la carga de videos desde la API
  loadVideos();


  /* ==========================================================================
     5. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
     ========================================================================== */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Cerrar todos los FAQs abiertos (Estilo exclusivo de acordeón)
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-content').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        // Calcular scrollHeight para una transición perfecta
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });


  /* ==========================================================================
     6. INTEGRACIÓN Y ENVÍO DE FORMULARIO DE CONTACTO A GOOGLE FORMS
     ========================================================================== */
  const contactForm = document.getElementById('google-contact-form');
  const formSuccessMessage = document.querySelector('.form-success-message');
  const submitBtn = document.getElementById('submit-contact-btn');

  const enviarFormulario = async (nombre, correo, descripcion) => {
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfObL2NoAv89-CQAS-QnMQ48klo-Vht4RI1mAkb72nR1K6Ijg/formResponse';

    const formData = new URLSearchParams();
    formData.append('entry.815257742', nombre);      // Campo: Nombre
    formData.append('entry.401319057', correo);      // Campo: Correo
    formData.append('entry.367001380', descripcion); // Campo: Descripción

    try {
      await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors', // Permite enviar sin errores de seguridad CORS
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      console.log('¡Datos enviados exitosamente a Google Forms!');
      return true;
    } catch (error) {
      console.error('Error al intentar enviar el formulario:', error);
      return false;
    }
  };

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nombreInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const descInput = document.getElementById('contact-desc');
      
      if (!nombreInput || !emailInput || !descInput) return;
      
      const nombre = nombreInput.value.trim();
      const correo = emailInput.value.trim();
      const descripcion = descInput.value.trim();
      
      // Cambiar estado del botón a cargando
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }
      
      // Enviar datos
      await enviarFormulario(nombre, correo, descripcion);
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Mensaje';
      }
      
      // Ocultar inputs del formulario y mostrar mensaje de éxito
      const formGroups = contactForm.querySelectorAll('.form-group, #submit-contact-btn, .form-subtitle');
      formGroups.forEach(el => el.style.display = 'none');
      
      if (formSuccessMessage) {
        formSuccessMessage.classList.remove('hidden');
      }
      
      // Limpiar formulario
      contactForm.reset();
    });
  }


  // Parser seguro para cantidad de estrellas (admite "3/5", fechas de Google Sheets, enteros y strings)
  function parseStars(val) {
    if (val === undefined || val === null || val === '') return 5;
    
    if (typeof val === 'number') {
      return Math.max(1, Math.min(5, Math.round(val)));
    }
    
    const str = String(val).trim();
    
    // Formato "3/5", "4/5", "5/5"
    const slashMatch = str.match(/^(\d+)\s*\/\s*(\d+)/);
    if (slashMatch) {
      const num = parseInt(slashMatch[1], 10);
      return Math.max(1, Math.min(5, num));
    }
    
    // Fallback para autoconversión de fecha en Google Sheets (ej: "2026-05-03T03:00:00.000Z" -> 3 estrellas)
    if (str.includes('T') && str.includes('-')) {
      try {
        const d = new Date(str);
        const day = d.getUTCDate();
        if (day >= 1 && day <= 5) {
          return day;
        }
      } catch (e) {}
    }
    
    // Número como string ("5", "4", "3")
    const num = parseInt(str, 10);
    if (!isNaN(num)) {
      return Math.max(1, Math.min(5, num));
    }
    
    return 5;
  }

  // Generador de SVG de estrellas amarillas (llenas y con solo borde)
  function renderStarRating(starsCount) {
    const total = 5;
    const filledCount = Math.max(1, Math.min(5, starsCount));
    let starsHtml = '<div class="testimonial-stars" aria-label="' + filledCount + ' de 5 estrellas">';
    for (let i = 1; i <= total; i++) {
      if (i <= filledCount) {
        starsHtml += `
          <svg viewBox="0 0 24 24" class="star-icon star-filled">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>`;
      } else {
        starsHtml += `
          <svg viewBox="0 0 24 24" class="star-icon star-empty">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>`;
      }
    }
    starsHtml += '</div>';
    return starsHtml;
  }


  /* ==========================================================================
     7. MODAL DE REPRODUCTOR DE VIDEO (SPLIT-VIEW PLAYER & INFO)
     ========================================================================== */
  const videoModal = document.querySelector('.video-modal-overlay');
  const videoModalClose = document.querySelector('.video-modal-close');

  function openVideoModal(videoData) {
    const playerContainer = document.getElementById('modal-player-container');
    const modalContainer = videoModal ? videoModal.querySelector('.video-modal-container') : null;
    const modalCard = videoModal ? videoModal.querySelector('.video-modal-card') : null;
    const tagEl = document.getElementById('modal-project-tag');
    const titleEl = document.getElementById('modal-project-title');
    const starsEl = document.getElementById('modal-project-stars');
    const descEl = document.getElementById('modal-project-desc');

    if (!videoModal || !playerContainer) return;

    let data = {};
    if (typeof videoData === 'string') {
      data = { url: videoData, title: 'Video de Portafolio', desc: 'Edición profesional de contenido audiovisual realizada por el equipo de iBod.', category: 'Trabajo' };
    } else {
      data = videoData || {};
    }

    const url = data.url || data.urlOriginal || '';
    const title = data.title || 'Sin Título';
    const desc = data.desc || 'Edición profesional de contenido audiovisual realizada por el equipo de iBod.';
    const category = data.category || 'Trabajo';

    // 1. Actualizar Información de la tarjeta en la columna derecha
    if (tagEl) tagEl.textContent = category;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    if (starsEl) {
      if (data.stars) {
        starsEl.innerHTML = renderStarRating(data.stars);
        starsEl.style.display = 'inline-flex';
      } else {
        starsEl.innerHTML = '';
        starsEl.style.display = 'none';
      }
    }

    const setVerticalState = (isVertical) => {
      if (isVertical) {
        playerContainer.classList.add('is-vertical');
        if (modalContainer) modalContainer.classList.add('is-vertical');
        if (modalCard) modalCard.classList.add('is-vertical');
      } else {
        playerContainer.classList.remove('is-vertical');
        if (modalContainer) modalContainer.classList.remove('is-vertical');
        if (modalCard) modalCard.classList.remove('is-vertical');
      }
    };

    // 2. Determinar si el video es vertical (Shorts / Reels)
    const isVert = data.isVertical !== undefined ? data.isVertical : isVerticalVideo(url, category);
    setVerticalState(isVert);

    // 3. Determinar proveedor del video (YouTube o Cloudinary / Directo)
    const provider = data.provider || (getYouTubeId(url) ? 'youtube' : 'cloudinary');
    playerContainer.innerHTML = '';
    playerContainer.style.cssText = ''; // limpiar cualquier estilo inline previo

    if (provider === 'youtube') {
      const ytId = data.ytId || getYouTubeId(url);
      playerContainer.innerHTML = `
        <iframe 
          src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&controls=1&enablejsapi=1&playsinline=1" 
          title="${title}" 
          class="modal-iframe-element" 
          frameborder="0" 
          allow="autoplay; encrypted-media; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    } else {
      playerContainer.innerHTML = `
        <video 
          src="${url}" 
          controls 
          autoplay 
          playsinline 
          class="modal-video-element">
        </video>
      `;
      const videoEl = playerContainer.querySelector('video');
      if (videoEl) {
        videoEl.muted = false; // Sonido activado en modal
        
        const updateRatio = () => {
          if (videoEl.videoWidth && videoEl.videoHeight) {
            const isVertical = videoEl.videoHeight > videoEl.videoWidth;
            setVerticalState(isVertical);
          }
        };

        if (videoEl.readyState >= 1) {
          updateRatio();
        } else {
          videoEl.addEventListener('loadedmetadata', updateRatio);
        }

        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.log('Autoplay modal blocked:', e));
        }
      }
    }

    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeVideoModal() {
    const playerContainer = document.getElementById('modal-player-container');
    const modalContainer = videoModal ? videoModal.querySelector('.video-modal-container') : null;
    const modalCard = videoModal ? videoModal.querySelector('.video-modal-card') : null;
    const starsEl = document.getElementById('modal-project-stars');
    if (videoModal) {
      videoModal.classList.remove('active');
      if (starsEl) {
        starsEl.innerHTML = '';
        starsEl.style.display = 'none';
      }
      if (playerContainer) {
        playerContainer.classList.remove('is-vertical');
        playerContainer.style.cssText = ''; // limpiar estilos inline
        const videoEl = playerContainer.querySelector('video');
        if (videoEl) {
          videoEl.pause();
          videoEl.src = '';
          videoEl.style.aspectRatio = '';
        }
        playerContainer.innerHTML = '';
      }
      if (modalContainer) modalContainer.classList.remove('is-vertical');
      if (modalCard) modalCard.classList.remove('is-vertical');
      document.body.style.overflow = '';
    }
  }

  // Delegación de clics para cualquier elemento estático de portafolio o showcase
  document.querySelectorAll('.portfolio-card:not([data-dynamic])').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const playBtn = card.querySelector('.project-play-btn');
      const videoSrc = playBtn ? playBtn.getAttribute('data-video') : 'ibod_video_slider_principal.webm';
      const title = card.querySelector('.project-creator')?.textContent || 'Proyecto Destacado';
      const desc = card.querySelector('.project-desc')?.textContent || 'Edición y producción audiovisual profesional.';
      const tag = card.querySelector('.project-tag')?.textContent || 'Destacado';

      openVideoModal({
        url: videoSrc || 'ibod_video_slider_principal.webm',
        title: title,
        desc: desc,
        category: tag
      });
    });
  });

  if (videoModalClose) {
    videoModalClose.addEventListener('click', closeVideoModal);
  }

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideoModal();
      }
    });
  }

  // Tecla Escape para cerrar modales
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoModal();
      closeMobileMenu();
    }
  });


  /* ==========================================================================
     8. EFECTO DE ESCALADO EN TARJETAS DE SERVICIOS (SCROLL STACKING SCALE)
     ========================================================================== */
  const serviceCards = Array.from(document.querySelectorAll('.service-card'));
  const stickyTop = 140; // Coincide con top: 140px en CSS

  const handleServiceCardsScale = () => {
    if (window.innerWidth > 768 && serviceCards.length > 0) {
      serviceCards.forEach((card, index) => {
        // La última tarjeta no se escala ya que ninguna otra se apila sobre ella
        if (index === serviceCards.length - 1) return;

        const nextCard = serviceCards[index + 1];
        if (!nextCard) return;

        const nextRect = nextCard.getBoundingClientRect();
        const cardHeight = card.offsetHeight || 480;

        // Distancia desde el tope sticky (140px) hasta el borde superior de la tarjeta entrante
        const distanceToSticky = nextRect.top - stickyTop;

        // Progreso de apilamiento: 0 (tarjeta entrante aún abajo) a 1 (apilada sobre la tarjeta actual)
        const progress = Math.min(Math.max((cardHeight - distanceToSticky) / cardHeight, 0), 1);

        // Escala progresiva marcada hasta 0.80 y oscurecimiento a 0.55 de brillo para profundidad visual pronunciada
        const scale = 1 - (progress * 0.20);
        const brightness = 1 - (progress * 0.45);

        card.style.transform = `scale(${scale})`;
        card.style.filter = `brightness(${brightness})`;
      });
    } else {
      // Limpiar estilos en móviles
      serviceCards.forEach(card => {
        card.style.transform = '';
        card.style.filter = '';
      });
    }
  };

  // Iniciar el efecto inmediatamente
  handleServiceCardsScale();

  // Escuchar scroll nativo, cambios de tamaño y eventos de Lenis
  window.addEventListener('scroll', handleServiceCardsScale, { passive: true });
  window.addEventListener('resize', handleServiceCardsScale, { passive: true });

  if (typeof lenis !== 'undefined' && lenis) {
    lenis.on('scroll', handleServiceCardsScale);
  }


  /* ==========================================================================
     9. SCROLL SUAVE PERSONALIZADO CON DESACELERACIÓN LENTA (CUSTOM SMOOTH SCROLL)
     ========================================================================== */
  const localLinks = document.querySelectorAll('a[href^="#"]');
  localLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      
      if (targetId === '#') {
        e.preventDefault();
        
        // Cerrar menú móvil si está abierto
        if (typeof closeMobileMenu === 'function') {
          closeMobileMenu();
        }
        
        if (lenis) {
          lenis.scrollTo(0, {
            duration: 1.2,
            easing: (t) => 1 - Math.pow(1 - t, 5)
          });
        } else {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        return;
      }
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        // Cerrar menú móvil si está abierto
        if (typeof closeMobileMenu === 'function') {
          closeMobileMenu();
        }
        
        let scrollOffset = -20; // Detiene el scroll 20px antes de la sección por defecto
        if (targetId === '#services' || targetId === '#work') {
          scrollOffset = 30; // Desplaza 30px por debajo del inicio para balancear el título y el contenido
        }

        if (lenis) {
          // Desplazamiento ultra-suave y amortiguado con Lenis
          lenis.scrollTo(targetElement, {
            offset: scrollOffset,
            duration: 1.6,
            easing: (t) => 1 - Math.pow(1 - t, 5) // easeOutQuint (frenado progresivo largo)
          });
        } else {
          // Fallback clásico si la librería Lenis falla al cargar
          const navbarOffset = -scrollOffset;
          const startPosition = window.scrollY || window.pageYOffset;
          const targetPosition = targetElement.getBoundingClientRect().top + startPosition - navbarOffset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  /* ==========================================================================
     10. OCULTAR/MOSTRAR NAVBAR AL HACER SCROLL (AUTO-HIDE NAVBAR ON SCROLL)
     ========================================================================== */
  const navbar = document.querySelector('.navbar');
  let lastScrollY = window.scrollY || window.pageYOffset;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY || window.pageYOffset;
    
    // Si el menú móvil está abierto, no ocultamos la barra
    const isMobileMenuOpen = mobileMenu && mobileMenu.classList.contains('active');
    
    if (currentScrollY > lastScrollY && currentScrollY > 150 && !isMobileMenuOpen) {
      // Deslizando hacia abajo: Ocultar
      navbar.classList.add('nav-hidden');
    } else if (currentScrollY < lastScrollY) {
      // Deslizando hacia arriba: Mostrar
      navbar.classList.remove('nav-hidden');
    }
    
    lastScrollY = currentScrollY;
  });


  /* ==========================================================================
     11. ASISTENTE VIRTUAL CHATBOT Y CONEXIÓN A FAQ APPS SCRIPT API
     ========================================================================== */
  const FAQ_API_URL = "https://script.google.com/macros/s/AKfycbyCvC_0rZkvu0mUtKRiaWlQvdnkXLmNCMMnVOg9Db9Gfx6ApcadwkSNA4KyXeWEVNVs8Q/exec?tipo=faq";

  const chatbotFab = document.getElementById('chatbot-toggle-fab');
  const chatbotWindow = document.getElementById('chatbot-window');
  const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
  const chatbotBody = document.getElementById('chatbot-body');
  const chatbotForm = document.getElementById('chatbot-form');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatChipsContainer = document.getElementById('chat-chips-container');
  const fabIconChat = chatbotFab ? chatbotFab.querySelector('.fab-icon-chat') : null;
  const fabIconClose = chatbotFab ? chatbotFab.querySelector('.fab-icon-close') : null;

  let faqList = [
    {
      question: "¿Cuál es el tiempo de entrega de un video?",
      answer: "Para videos cortos (Shorts/Reels/TikTok), la entrega promedio es de 48 a 72 horas. Para videos de YouTube largos (de 10 a 20 minutos), la entrega del primer corte suele tardar entre 4 a 5 días hábiles.",
      keywords: ["tiempo", "tardan", "entrega", "demora", "plazo", "dias", "horas"]
    },
    {
      question: "¿Cómo funcionan las revisiones?",
      answer: "Utilizamos enlaces interactivos de Frame.io donde puedes hacer comentarios y marcas exactamente en el segundo del video donde deseas un ajuste. Las revisiones menores se resuelven en menos de 24 horas.",
      keywords: ["revision", "revisiones", "cambio", "cambios", "frame.io", "ajuste"]
    },
    {
      question: "¿Pueden adaptarse a mi estilo de edición?",
      answer: "Sí, absolutamente. Analizamos tus videos anteriores para replicar tus tipografías, colores de marca, tipo de transiciones, uso de efectos de sonido e identidad visual.",
      keywords: ["estilo", "marca", "adaptar", "propio", "identidad", "personalizado"]
    },
    {
      question: "¿Qué necesito para empezar a trabajar?",
      answer: "Sólo necesitas agendar una breve llamada o enviarnos un mensaje con los objetivos de tu canal. Posteriormente subirás el metraje bruto a nuestra carpeta compartida.",
      keywords: ["empezar", "comenzar", "requisitos", "inicio", "contratar"]
    }
  ];

  // Alternar apertura/cierre del Chatbot
  const toggleChatbot = () => {
    if (!chatbotWindow) return;
    const isActive = chatbotWindow.classList.contains('active');
    if (isActive) {
      chatbotWindow.classList.remove('active');
      if (fabIconChat) fabIconChat.style.display = 'block';
      if (fabIconClose) fabIconClose.style.display = 'none';
    } else {
      chatbotWindow.classList.add('active');
      if (fabIconChat) fabIconChat.style.display = 'none';
      if (fabIconClose) fabIconClose.style.display = 'block';
      if (chatbotInput) chatbotInput.focus();
    }
  };

  const chatbotContactAction = document.getElementById('chatbot-contact-action');
  const chatbotFaqAction = document.getElementById('chatbot-faq-action');

  if (chatbotFab) chatbotFab.addEventListener('click', toggleChatbot);
  if (chatbotCloseBtn) chatbotCloseBtn.addEventListener('click', toggleChatbot);
  if (chatbotContactAction) {
    chatbotContactAction.addEventListener('click', (e) => {
      e.preventDefault();
      toggleChatbot();
      const bookSec = document.getElementById('book');
      if (bookSec) {
        bookSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const showFaqMenu = () => {
    if (!chatbotBody) return;

    const existingChips = chatbotBody.querySelector('.chat-chips-wrapper');
    const allBubbles = chatbotBody.querySelectorAll('.chat-bubble');

    // Si ya hubo interacción o mensajes en la conversación, agregar un bloque fresco de FAQs
    if (allBubbles.length > 2) {
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble bot-bubble';
      bubble.textContent = 'Aquí tienes las preguntas frecuentes sobre nuestro servicio:';

      const chipsWrap = document.createElement('div');
      chipsWrap.className = 'chat-chips-wrapper';
      chipsWrap.style.marginTop = '10px';

      const container = document.createElement('div');
      container.className = 'chat-chips-container';

      faqList.forEach((item) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chat-chip';
        chip.textContent = item.question;
        chip.addEventListener('click', () => {
          handleUserMessage(item.question);
        });
        container.appendChild(chip);
      });

      chipsWrap.appendChild(container);
      bubble.appendChild(chipsWrap);
      chatbotBody.appendChild(bubble);
      chatbotBody.scrollTop = chatbotBody.scrollHeight;
    } else if (existingChips) {
      existingChips.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      existingChips.style.transition = 'transform 0.2s ease';
      existingChips.style.transform = 'scale(1.02)';
      setTimeout(() => {
        existingChips.style.transform = 'scale(1)';
      }, 250);
    }
  };

  if (chatbotFaqAction) {
    chatbotFaqAction.addEventListener('click', (e) => {
      e.preventDefault();
      showFaqMenu();
    });
  }

  // Evitar que el scroll del mouse sobre la ventana del chatbot desplace la página principal
  if (chatbotWindow) {
    const preventParentScroll = (e) => {
      e.stopPropagation();
    };
    chatbotWindow.addEventListener('wheel', preventParentScroll, { passive: true });
    chatbotWindow.addEventListener('touchmove', preventParentScroll, { passive: true });
  }

  // Renderizar chips de preguntas rápidas
  const renderChatChips = () => {
    if (!chatChipsContainer) return;
    chatChipsContainer.innerHTML = '';

    faqList.forEach((item) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chat-chip';
      chip.textContent = item.question;
      chip.addEventListener('click', () => {
        handleUserMessage(item.question);
      });
      chatChipsContainer.appendChild(chip);
    });
  };

  // Cargar FAQs desde la API de Google Apps Script (tipo=faq)
  async function loadFaqFromApi() {
    try {
      const response = await fetch(FAQ_API_URL);
      const rawResponse = await response.json();
      const rawData = rawResponse.data || rawResponse;

      if (Array.isArray(rawData) && rawData.length > 0) {
        const apiFaqs = rawData.map(item => {
          const q = (item.Pregunta_Frecuente || item.pregunta || item.question || '').trim();
          const a = (item.Respuesta_Sintetizada || item.respuesta || item.answer || '').trim();
          const kwStr = (item.Palabras_Clave || item.keywords || '').trim();
          const kw = kwStr ? kwStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) : [];
          return { question: q, answer: a, keywords: kw };
        }).filter(f => f.question && f.answer);

        if (apiFaqs.length > 0) {
          faqList = apiFaqs;
        }
      }
    } catch (error) {
      console.log("Cargadas FAQs por defecto.");
    }
    renderChatChips();
  }

  // Iniciar la carga de FAQs
  loadFaqFromApi();

  // Función para agregar burbujas al historial de chat
  const appendChatBubble = (text, sender = 'bot', showContactBtn = false) => {
    if (!chatbotBody) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}-bubble`;
    
    const textPara = document.createElement('p');
    textPara.style.margin = '0';
    textPara.textContent = text;
    bubble.appendChild(textPara);

    if (showContactBtn) {
      const btnWrapper = document.createElement('div');
      btnWrapper.style.marginTop = '10px';
      
      const contactBtn = document.createElement('a');
      contactBtn.href = '#book';
      contactBtn.className = 'btn btn-primary';
      contactBtn.style.padding = '6px 14px';
      contactBtn.style.fontSize = '0.78rem';
      contactBtn.style.borderRadius = '100px';
      contactBtn.style.textDecoration = 'none';
      contactBtn.style.display = 'inline-flex';
      contactBtn.style.alignItems = 'center';
      contactBtn.style.gap = '6px';
      contactBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        Ir a Contacto
      `;

      contactBtn.addEventListener('click', () => {
        if (chatbotWindow) chatbotWindow.classList.remove('active');
        if (fabIconChat) fabIconChat.style.display = 'block';
        if (fabIconClose) fabIconClose.style.display = 'none';
      });

      btnWrapper.appendChild(contactBtn);
      bubble.appendChild(btnWrapper);
    }

    chatbotBody.appendChild(bubble);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  };

  // Buscar mejor respuesta en las FAQs
  const findFaqAnswer = (userText) => {
    const query = userText.toLowerCase().trim();
    if (!query) return null;

    // 1. Coincidencia exacta o parcial en la pregunta
    for (const item of faqList) {
      if (item.question.toLowerCase().includes(query) || query.includes(item.question.toLowerCase())) {
        return item.answer;
      }
    }

    // 2. Coincidencia por palabras clave
    for (const item of faqList) {
      if (item.keywords && item.keywords.some(kw => kw && kw.length > 2 && query.includes(kw))) {
        return item.answer;
      }
    }

    return null;
  };

  // Manejar envío de mensaje del usuario
  const handleUserMessage = (text) => {
    if (!text || !text.trim()) return;

    appendChatBubble(text, 'user');
    if (chatbotInput) chatbotInput.value = '';

    // Mostrar respuesta simulando tiempo de escritura
    setTimeout(() => {
      const answer = findFaqAnswer(text);
      if (answer) {
        appendChatBubble(answer, 'bot');
      } else {
        appendChatBubble("No encontré esa consulta exacta en nuestra base de datos, pero puedes dejarnos tu mensaje en nuestro formulario de contacto o escribirnos directamente a ibod.bot@gmail.com para ayudarte inmediatamente.", 'bot', true);
      }
    }, 400);
  };

  if (chatbotForm) {
    chatbotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (chatbotInput) {
        handleUserMessage(chatbotInput.value);
      }
    });
  }


  /* ==========================================================================
     12. CARRUSEL DINÁMICO DE TESTIMONIOS (REELS DE CLIENTES CON API)
     ========================================================================== */
  const TESTIMONIOS_API_URL = "https://script.google.com/macros/s/AKfycbzncM-ncIHcE69Pc1LPzNSXSEsVxkRioIeuKnzYWKakOPTF0SXNDZZRtTctE_SX4JGH/exec?tipo=testimonios";

  const testimonialsTrack = document.getElementById('testimonials-track');
  const testimonialsPrev = document.getElementById('testimonials-prev');
  const testimonialsNext = document.getElementById('testimonials-next');

  // Renderizar esqueletos de carga de testimonios
  function renderTestimonialSkeletons() {
    if (!testimonialsTrack) return;
    let skeletonHtml = '';
    for (let i = 0; i < 4; i++) {
      skeletonHtml += `
        <div class="skeleton-testimonial-card">
          <div class="skeleton skeleton-testimonial-thumb">
            <div class="skeleton skeleton-tag"></div>
          </div>
          <div class="skeleton-testimonial-info">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-desc"></div>
          </div>
        </div>
      `;
    }
    testimonialsTrack.innerHTML = skeletonHtml;
  }

  // Cargar testimonios desde la API
  async function loadTestimonios() {
    if (!testimonialsTrack) return;

    renderTestimonialSkeletons();

    try {
      const response = await fetch(TESTIMONIOS_API_URL);
      const rawResponse = await response.json();
      const items = rawResponse.data || rawResponse;

      if (!Array.isArray(items) || items.length === 0) {
        testimonialsTrack.innerHTML = '<p style="color: var(--text-muted); padding: 40px; width: 100%; text-align: center;">No hay testimonios disponibles en este momento.</p>';
        return;
      }

      testimonialsTrack.innerHTML = '';

      items.forEach(item => {
        const cuenta = item.cuenta || 'Cliente iBod';
        const videoUrl = (item.video || '').trim();
        if (!videoUrl) return;

        const descripcion = (item.descripcion || item.desc || '').trim();
        const stars = parseStars(item.estrellas);
        const poster = getCloudinaryPoster(videoUrl);

        const card = document.createElement('div');
        card.className = 'testimonial-video-card reveal visible';

        card.innerHTML = `
          <div class="testimonial-video-thumb">
            <video 
              src="${videoUrl}" 
              ${poster ? `poster="${poster}"` : ''} 
              class="testimonial-thumb-video" 
              autoplay 
              muted 
              loop 
              playsinline 
              webkit-playsinline
              preload="auto"
              aria-label="Testimonio de ${cuenta}">
            </video>
            <div class="portfolio-thumb-overlay"></div>
            <span class="project-tag">Testimonio</span>
            <button class="project-play-btn" data-video="${videoUrl}" aria-label="Ver testimonio de ${cuenta}">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            </button>
          </div>
          <div class="testimonial-video-info">
            <div class="testimonial-header-row">
              <h4 class="testimonial-account-name">${cuenta}</h4>
              ${renderStarRating(stars)}
            </div>
            ${descripcion ? `<p class="testimonial-card-desc" title="${descripcion}">${descripcion}</p>` : ''}
          </div>
        `;

        testimonialsTrack.appendChild(card);

        // Autoplay silenciado seguro para el video thumbnail
        const videoEl = card.querySelector('video');
        if (videoEl) {
          videoEl.muted = true;
          videoEl.defaultMuted = true;
          videoEl.playsInline = true;
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.log('Autoplay testimonial diferido:', e));
          }
        }

        // Al hacer clic, abrir modal vertical con audio, estrellas y la descripción completa
        card.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof openVideoModal === 'function') {
            openVideoModal({
              url: videoUrl,
              title: cuenta,
              desc: descripcion || 'Testimonio de cliente de iBod.',
              category: 'Testimonio',
              stars: stars,
              isVertical: true,
              provider: 'cloudinary'
            });
          }
        });
      });

      // Inicializar navegación y gestos de desplazamiento del carrusel
      setupTestimonialsCarousel();

    } catch (error) {
      console.error('Error al cargar testimonios:', error);
      testimonialsTrack.innerHTML = '<p style="color: var(--text-muted); padding: 40px; width: 100%; text-align: center;">No se pudieron cargar los testimonios.</p>';
    }
  }

  // Configuración de controles y arrastre (drag-to-scroll) para el carrusel
  function setupTestimonialsCarousel() {
    if (!testimonialsTrack) return;

    if (testimonialsPrev) {
      testimonialsPrev.addEventListener('click', () => {
        const cardWidth = testimonialsTrack.querySelector('.testimonial-video-card')?.offsetWidth || 280;
        testimonialsTrack.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
      });
    }

    if (testimonialsNext) {
      testimonialsNext.addEventListener('click', () => {
        const cardWidth = testimonialsTrack.querySelector('.testimonial-video-card')?.offsetWidth || 280;
        testimonialsTrack.scrollBy({ left: (cardWidth + 24), behavior: 'smooth' });
      });
    }

    // Arrastre con mouse (Mouse Drag)
    let isDown = false;
    let startX;
    let scrollLeft;
    let hasMoved = false;

    testimonialsTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      hasMoved = false;
      testimonialsTrack.classList.add('is-dragging');
      startX = e.pageX - testimonialsTrack.offsetLeft;
      scrollLeft = testimonialsTrack.scrollLeft;
    });

    testimonialsTrack.addEventListener('mouseleave', () => {
      isDown = false;
      testimonialsTrack.classList.remove('is-dragging');
    });

    testimonialsTrack.addEventListener('mouseup', () => {
      isDown = false;
      testimonialsTrack.classList.remove('is-dragging');
    });

    testimonialsTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - testimonialsTrack.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        hasMoved = true;
      }
      testimonialsTrack.scrollLeft = scrollLeft - walk;
    });

    // Prevenir apertura de modal si el usuario estuvo arrastrando el carrusel
    testimonialsTrack.addEventListener('click', (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  // Iniciar carga de testimonios
  loadTestimonios();
});
