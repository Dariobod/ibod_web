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

  // Regla de formato: Solamente si la categoría empieza con "Reel-" se muestra la tarjeta en formato vertical (9:16). El resto en horizontal (16:9).
  function isVerticalVideo(url, category) {
    if (!category) category = '';
    const catTrimmed = category.trim().toLowerCase();
    const isShortUrl = /\/shorts\//i.test(url || '');
    return catTrimmed.startsWith('reel-') || isShortUrl;
  }

  // Renderizado dinámico de botones de filtro por categoría
  function renderFilterButtons(categories) {
    const filtersContainer = document.getElementById('portfolio-filters');
    if (!filtersContainer) return;

    filtersContainer.innerHTML = `
      <button class="filter-btn active" data-filter="all">Todas</button>
    `;

    categories.forEach(cat => {
      if (!cat) return;
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
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
        const currentCards = document.querySelectorAll('.portfolio-card');

        currentCards.forEach(card => {
          const category = card.getAttribute('data-category');

          if (filterValue === 'all' || category === filterValue) {
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
      });
    });
  }

  // Función para renderizar las tarjetas (Cards) en el DOM
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
      
      card.innerHTML = `
        <div class="portfolio-thumbnail">
          <iframe 
            src="https://www.youtube-nocookie.com/embed/${v.ytId}?autoplay=1&mute=1&loop=1&playlist=${v.ytId}&controls=0&showinfo=0&rel=0&enablejsapi=1&playsinline=1&modestbranding=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3" 
            title="${v.title}" 
            class="portfolio-thumb-video" 
            frameborder="0" 
            allow="autoplay; encrypted-media; picture-in-picture" 
            allowfullscreen>
          </iframe>
          <div class="portfolio-thumb-overlay"></div>
          <span class="project-tag">${v.category}</span>
          <a href="${v.urlOriginal}" target="_blank" rel="noopener noreferrer" class="project-play-btn" aria-label="Ver video en YouTube">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </a>
        </div>
        <div class="portfolio-info">
          <h4 class="project-creator">${v.title}</h4>
          <p class="project-desc">${v.desc}</p>
        </div>
      `;
      
      container.appendChild(card);

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
        return;
      }

      const videos = rawData.map(item => {
        const link = item.link || item.url || '';
        const ytId = getYouTubeId(link);
        const cat = (item.categoria || item.category || 'General').trim();
        return {
          title: item.titulo || item.title || 'Sin Título',
          desc: item.descripcion || item.desc || '',
          category: cat,
          urlOriginal: link,
          ytId: ytId,
          thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : ''
        };
      }).filter(v => v.ytId !== null);

      if (videos.length > 0) {
        allTrabajos = videos;
        // Obtener categorías únicas dinámicamente desde los datos de la planilla
        const uniqueCategories = [...new Set(videos.map(v => v.category))];
        renderFilterButtons(uniqueCategories);
        renderGrid(allTrabajos, 'portfolio-grid');
      }
    } catch (error) {
      console.error("Error al cargar trabajos desde API:", error);
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


  /* ==========================================================================
     7. MODAL DE REPRODUCTOR DE VIDEO
     ========================================================================== */
  const videoModal = document.querySelector('.video-modal-overlay');
  const videoModalClose = document.querySelector('.video-modal-close');
  const modalVideoElement = document.querySelector('.modal-video-element');
  const playButtons = document.querySelectorAll('.project-play-btn, .showcase-play-btn');

  const openVideoModal = (videoSrc) => {
    if (videoModal && modalVideoElement) {
      modalVideoElement.src = videoSrc;
      videoModal.classList.add('active');
      modalVideoElement.play();
      document.body.style.overflow = 'hidden';
    }
  };

  const closeVideoModal = () => {
    if (videoModal && modalVideoElement) {
      videoModal.classList.remove('active');
      modalVideoElement.pause();
      modalVideoElement.src = '';
      document.body.style.overflow = '';
    }
  };

  playButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita clics en la tarjeta
      
      // Si el botón tiene un data-video específico, lo cargamos. Si no, usamos el por defecto.
      const videoSrc = btn.getAttribute('data-video') || 'ibod_video_slider_principal.webm';
      openVideoModal(videoSrc);
    });
  });

  if (videoModalClose) {
    videoModalClose.addEventListener('click', closeVideoModal);
  }

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      // Cierra si hace clic fuera del contenedor del video
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

  if (chatbotFab) chatbotFab.addEventListener('click', toggleChatbot);
  if (chatbotCloseBtn) chatbotCloseBtn.addEventListener('click', toggleChatbot);

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
          const q = item.Pregunta_Frecuente || item.pregunta || item.question || '';
          const a = item.Respuesta_Sintetizada || item.respuesta || item.answer || '';
          const kwStr = item.Palabras_Clave || item.keywords || '';
          const kw = kwStr.split(',').map(k => k.trim().toLowerCase());
          return { question: q, answer: a, keywords: kw };
        }).filter(f => f.question && f.answer);

        if (apiFaqs.length > 0) {
          faqList = [...apiFaqs, ...faqList];
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
});
