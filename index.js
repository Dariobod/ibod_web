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
      const card = document.createElement('div');
      card.className = "portfolio-card reveal visible";
      card.setAttribute('data-category', v.category);
      
      card.innerHTML = `
        <div class="portfolio-thumbnail">
          <img src="${v.thumbnail}" alt="${v.title}" class="portfolio-thumb-img" onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${v.ytId}/hqdefault.jpg';" />
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
          <div style="margin-top: 14px;">
            <a href="${v.urlOriginal}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="color: #ff0000;">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              Ver en YouTube
            </a>
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
  }

  // Función principal para cargar los trabajos (videos) desde Google Apps Script
  async function loadVideos() {
    const container = document.getElementById('portfolio-grid');
    if (!container) return;

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
  const serviceCards = document.querySelectorAll('.service-card');
  const stickyTop = 140; // Valor del top en CSS
  let cardOffsets = [];

  // Función para precalcular las posiciones absolutas de las tarjetas y evitar Layout Thrashing (saltos)
  const updateCardOffsets = () => {
    cardOffsets = [];
    serviceCards.forEach(card => {
      let offset = 0;
      let el = card;
      while (el) {
        offset += el.offsetTop;
        el = el.offsetParent;
      }
      cardOffsets.push(offset);
    });
  };

  const handleServiceCardsScale = () => {
    if (window.innerWidth > 768) {
      const scrollY = window.scrollY || window.pageYOffset;
      
      serviceCards.forEach((card, index) => {
        // No aplicamos escalado a la última tarjeta ya que ninguna se apila sobre ella
        if (index === serviceCards.length - 1) return;
        
        const nextCardOffsetTop = cardOffsets[index + 1];
        if (nextCardOffsetTop === undefined) return;
        
        const cardHeight = 480; // Altura fija de la tarjeta
        
        // Distancia desde el top de la siguiente tarjeta hasta la posición sticky (cálculo ultra-rápido)
        const distance = nextCardOffsetTop - scrollY - stickyTop;
        
        // Progreso de 0 (lejos) a 1 (apilada sobre la tarjeta actual)
        const progress = Math.min(Math.max((cardHeight - distance) / cardHeight, 0), 1);
        
        // Escala final de 0.95 y brillo de 0.7
        const scale = 1 - (progress * 0.05);
        const brightness = 1 - (progress * 0.3);
        
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

  // Precalcular offsets al cargar e iniciar
  updateCardOffsets();
  handleServiceCardsScale();

  window.addEventListener('scroll', handleServiceCardsScale);
  
  // Recalcular posiciones solo cuando se redimensiona la ventana
  window.addEventListener('resize', () => {
    updateCardOffsets();
    handleServiceCardsScale();
  });


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
        
        // Recalcular offsets por si hubo cambios de layout
        updateCardOffsets();
        
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
});
