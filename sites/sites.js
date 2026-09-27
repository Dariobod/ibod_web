document.addEventListener('DOMContentLoaded', () => {

  // Helper para detectar formato mobile
  const isMobileScreen = () => window.innerWidth <= 768;

  /* ==========================================================================
     0. INICIALIZACIÓN DE LENIS (SCROLL SUAVE GLOBAL)
     ========================================================================== */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1.0,
      smoothTouch: false,
      touchMultiplier: 2.0
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ==========================================================================
     1. SCROLL REVEAL (ANIMACIÓN DE ENTRADA)
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  };

  const revealObserver = new IntersectionObserver(revealCallback, {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  /* ==========================================================================
     2. MENÚ MÓVIL
     ========================================================================== */
  const menuToggle = document.querySelector('.menu-toggle');
  const menuClose = document.querySelector('.menu-close');
  const mobileMenu = document.querySelector('.mobile-menu-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  const openMobileMenu = () => {
    if (mobileMenu) {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeMobileMenu = () => {
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
  if (menuClose) menuClose.addEventListener('click', closeMobileMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  /* ==========================================================================
     3. NAVEGACIÓN SUAVE CON LENIS EN CLICS DE ENLACES (TÍTULO BIEN ARRIBA)
     ========================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      
      // Cerrar menú móvil si está abierto
      if (typeof closeMobileMenu === 'function') {
        closeMobileMenu();
      }

      if (targetId === '#' || targetId === '' || targetId === '#hero') {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(0, {
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();

        // Offset ajustado idéntico a iBod para que el título quede bien arriba
        let scrollOffset = 30;
        if (targetId === '#book') {
          scrollOffset = -10;
        }

        if (lenis) {
          lenis.scrollTo(targetElement, {
            offset: scrollOffset,
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
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
     4. OCULTAR/MOSTRAR NAVBAR AL HACER SCROLL SUTILMENTE
     ========================================================================== */
  const navbar = document.querySelector('.navbar');
  let lastScrollY = window.scrollY || window.pageYOffset;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY || window.pageYOffset;
    const isMobileMenuOpen = mobileMenu && mobileMenu.classList.contains('active');
    
    if (currentScrollY > lastScrollY && currentScrollY > 120 && !isMobileMenuOpen) {
      // Deslizando hacia abajo: Ocultar sutilmente
      navbar.classList.add('nav-hidden');
    } else if (currentScrollY < lastScrollY) {
      // Deslizando hacia arriba: Mostrar sutilmente
      navbar.classList.remove('nav-hidden');
    }
    
    lastScrollY = currentScrollY;
  }, { passive: true });

  /* ==========================================================================
     5. CLICK EN EL VIDEO DEL HERO -> ENVIAR AL FORMULARIO DE CONTACTO
     ========================================================================== */
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    heroSection.addEventListener('click', (e) => {
      // Si el clic ocurrió sobre el navbar o sus hijos, ignorar
      if (e.target.closest('.navbar') || e.target.closest('.mobile-menu-overlay')) {
        return;
      }
      const contactSection = document.querySelector('#book');
      if (contactSection) {
        if (lenis) {
          lenis.scrollTo(contactSection, {
            offset: -10,
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  /* ==========================================================================
     4. EFECTO DE ESCALADO Y APILAMIENTO EN TARJETAS DE TRABAJOS (STACKING CARDS)
     ========================================================================== */
  const serviceCards = Array.from(document.querySelectorAll('.service-card'));
  const stickyTop = 140;

  const handleServiceCardsScale = () => {
    if (window.innerWidth > 768 && serviceCards.length > 0) {
      serviceCards.forEach((card, index) => {
        if (index === serviceCards.length - 1) return;

        const nextCard = serviceCards[index + 1];
        if (!nextCard) return;

        const nextRect = nextCard.getBoundingClientRect();
        const cardHeight = card.offsetHeight || 480;
        const distanceToSticky = nextRect.top - stickyTop;
        const progress = Math.min(Math.max((cardHeight - distanceToSticky) / cardHeight, 0), 1);

        const scale = 1 - (progress * 0.18);
        const brightness = 1 - (progress * 0.40);

        card.style.transform = `scale(${scale})`;
        card.style.filter = `brightness(${brightness})`;
      });
    } else {
      serviceCards.forEach(card => {
        card.style.transform = '';
        card.style.filter = '';
      });
    }
  };

  window.addEventListener('scroll', handleServiceCardsScale, { passive: true });
  window.addEventListener('resize', handleServiceCardsScale);
  handleServiceCardsScale();

  /* ==========================================================================
     5. FORMULARIO DE CONTACTO (GOOGLE FORMS)
     ========================================================================== */
  const contactForm = document.getElementById('google-contact-form');
  const formSuccessMessage = document.querySelector('.form-success-message');
  const submitBtn = document.getElementById('submit-contact-btn');

  const enviarFormulario = async (nombre, correo, descripcion) => {
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfObL2NoAv89-CQAS-QnMQ48klo-Vht4RI1mAkb72nR1K6Ijg/formResponse';

    const formData = new URLSearchParams();
    formData.append('entry.815257742', nombre);
    formData.append('entry.401319057', correo);
    formData.append('entry.367001380', `[iBod Sites] ${descripcion}`);

    try {
      await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      return true;
    } catch (error) {
      console.error('Error al enviar formulario:', error);
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
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }
      
      await enviarFormulario(nombre, correo, descripcion);
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Mensaje';
      }
      
      const formGroups = contactForm.querySelectorAll('.form-group, #submit-contact-btn, .form-subtitle');
      formGroups.forEach(el => el.style.display = 'none');
      
      if (formSuccessMessage) {
        formSuccessMessage.classList.remove('hidden');
      }
      
      contactForm.reset();
    });
  }

  /* ==========================================================================
     6. CARRUSEL AUTOMÁTICO DE SERVICIOS (MODERNO & MINIMALISTA CON EFECTO 3D)
     ========================================================================== */
  const servicesTrack = document.getElementById('services-carousel-track');
  const servicesViewport = document.getElementById('services-carousel-viewport');
  const servicesCards = Array.from(document.querySelectorAll('.sites-services-carousel-track .sites-service-card'));
  const servicesPrevBtn = document.getElementById('services-carousel-prev');
  const servicesNextBtn = document.getElementById('services-carousel-next');
  const servicesDots = Array.from(document.querySelectorAll('.services-dot'));

  if (servicesTrack && servicesViewport && servicesCards.length > 0) {
    let currentServiceIndex = 0;
    const totalServices = servicesCards.length;
    let autoSlideInterval = null;
    const AUTO_SLIDE_DELAY = 4000; // 4 segundos entre transiciones

    const updateServiceCarousel = (animate = true) => {
      if (currentServiceIndex < 0) currentServiceIndex = totalServices - 1;
      if (currentServiceIndex >= totalServices) currentServiceIndex = 0;

      const activeCard = servicesCards[currentServiceIndex];
      if (!activeCard) return;

      // Calcular la posición exacta para centrar la tarjeta activa en el viewport
      const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
      const viewportCenter = servicesViewport.offsetWidth / 2;
      const targetTranslate = viewportCenter - cardCenter;

      if (animate) {
        servicesTrack.style.transition = 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
      } else {
        servicesTrack.style.transition = 'none';
      }

      servicesTrack.style.transform = `translateX(${targetTranslate}px)`;

      // Actualizar clases activas en las tarjetas (efecto de escala y brillo)
      servicesCards.forEach((card, idx) => {
        if (idx === currentServiceIndex) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      // Actualizar indicadores (dots)
      servicesDots.forEach((dot, idx) => {
        if (idx === currentServiceIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    };

    const nextServiceSlide = () => {
      currentServiceIndex = (currentServiceIndex + 1) % totalServices;
      updateServiceCarousel(true);
    };

    const prevServiceSlide = () => {
      currentServiceIndex = (currentServiceIndex - 1 + totalServices) % totalServices;
      updateServiceCarousel(true);
    };

    const startAutoSlide = () => {
      stopAutoSlide();
      autoSlideInterval = setInterval(nextServiceSlide, AUTO_SLIDE_DELAY);
    };

    const stopAutoSlide = () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
      }
    };

    // Botones de navegación
    if (servicesPrevBtn) {
      servicesPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevServiceSlide();
        startAutoSlide();
      });
    }

    if (servicesNextBtn) {
      servicesNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextServiceSlide();
        startAutoSlide();
      });
    }

    // Clic en dots
    servicesDots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        currentServiceIndex = idx;
        updateServiceCarousel(true);
        startAutoSlide();
      });
    });

    // Clic en tarjetas laterales no activas para llevarlas al centro
    servicesCards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (currentServiceIndex !== idx) {
          currentServiceIndex = idx;
          updateServiceCarousel(true);
          startAutoSlide();
        }
      });
    });

    // Pausar auto-deslizamiento al pasar el cursor o interactuar
    const carouselWrapper = document.querySelector('.sites-services-carousel-wrapper');
    if (carouselWrapper) {
      carouselWrapper.addEventListener('mouseenter', stopAutoSlide);
      carouselWrapper.addEventListener('mouseleave', startAutoSlide);
    }

    // Soporte táctil / Swipe para móviles
    let touchStartX = 0;
    let touchEndX = 0;

    servicesViewport.addEventListener('touchstart', (e) => {
      stopAutoSlide();
      touchStartX = e.touches[0].clientX;
      touchEndX = touchStartX;
    }, { passive: true });

    servicesViewport.addEventListener('touchmove', (e) => {
      touchEndX = e.touches[0].clientX;
    }, { passive: true });

    servicesViewport.addEventListener('touchend', () => {
      const diffX = touchStartX - touchEndX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          nextServiceSlide();
        } else {
          prevServiceSlide();
        }
      }
      startAutoSlide();
    });

    // Recalcular en redimensionamiento de ventana
    window.addEventListener('resize', () => {
      updateServiceCarousel(false);
    }, { passive: true });

    // Inicializar carrusel
    setTimeout(() => {
      updateServiceCarousel(false);
      startAutoSlide();
    }, 150);
  }

});
