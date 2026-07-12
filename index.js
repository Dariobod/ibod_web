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
     4. FILTROS DE PORTAFOLIO
     ========================================================================== */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Cambiar clase activa en botones
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const filterValue = button.getAttribute('data-filter');

      portfolioCards.forEach(card => {
        const category = card.getAttribute('data-category');

        if (filterValue === 'all' || category === filterValue) {
          // Animación suave de aparición
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          // Desaparición suave
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });


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
     6. MOCKUP INTERACTIVO DE CALENDARIO (CALENDLY MOCKUP)
     ========================================================================== */
  const calendarDays = document.querySelectorAll('.calendar-day.active-day');
  const calendarHours = document.querySelector('.calendar-hours');
  const selectedDayLabel = document.querySelector('.selected-day-label');
  const hourButtons = document.querySelectorAll('.hour-btn');
  const calendlyForm = document.querySelector('.calendly-form');
  const calendlySuccess = document.querySelector('.calendly-success');
  const successIcon = document.querySelector('.success-icon');
  
  // Opciones iniciales ocultas
  let selectedDate = '';
  let selectedHour = '';

  calendarDays.forEach(day => {
    day.addEventListener('click', () => {
      // Remover selección previa
      calendarDays.forEach(d => d.classList.remove('selected-day'));
      day.classList.add('selected-day');

      // Obtener el día seleccionado
      selectedDate = day.getAttribute('data-day');
      selectedDayLabel.textContent = `${selectedDate} de Julio`;

      // Mostrar horas y ocultar formulario/éxito si estuvieran abiertos
      calendarHours.classList.remove('hidden');
      calendlyForm.classList.add('hidden');
      calendlySuccess.classList.add('hidden');

      // Limpiar selección de horas
      hourButtons.forEach(h => h.classList.remove('selected-hour'));
    });
  });

  hourButtons.forEach(hour => {
    hour.addEventListener('click', () => {
      hourButtons.forEach(h => h.classList.remove('selected-hour'));
      hour.classList.add('selected-hour');

      selectedHour = hour.textContent;

      // Mostrar formulario
      calendlyForm.classList.remove('hidden');
      calendlySuccess.classList.add('hidden');
    });
  });

  // Envío del Formulario
  if (calendlyForm) {
    calendlyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Ocultar todo lo demás y mostrar éxito
      calendarHours.classList.add('hidden');
      calendlyForm.classList.add('hidden');
      
      // Deseleccionar días y horas del calendario
      calendarDays.forEach(d => d.classList.remove('selected-day'));
      
      calendlySuccess.classList.remove('hidden');
    });
  }

  // Reset del Calendario
  const btnReset = document.querySelector('.btn-reset-calendly');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      calendlySuccess.classList.add('hidden');
      selectedDate = '';
      selectedHour = '';
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
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        // Cerrar menú móvil si está abierto
        if (typeof closeMobileMenu === 'function') {
          closeMobileMenu();
        }
        
        // Recalcular offsets por si hubo cambios de layout
        updateCardOffsets();
        
        if (lenis) {
          // Desplazamiento ultra-suave y amortiguado con Lenis
          lenis.scrollTo(targetElement, {
            offset: -110,
            duration: 1.6,
            easing: (t) => 1 - Math.pow(1 - t, 5) // easeOutQuint (frenado progresivo largo)
          });
        } else {
          // Fallback clásico si la librería Lenis falla al cargar
          const navbarOffset = 110;
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
