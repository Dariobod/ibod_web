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
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const targetId = anchor.getAttribute('href');
    if (!targetId) return;

    // Si es un click en una tarjeta lateral del carrusel, permitir que el handler de la card la centre
    const parentCard = anchor.closest('.sites-service-card');
    if (parentCard && !parentCard.classList.contains('active')) {
      return;
    }

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
     6. CARRUSEL AUTOMÁTICO DE SERVICIOS (3 CARDS VISIBLES EN DESKTOP)
     ========================================================================== */
  const servicesTrack = document.getElementById('services-carousel-track');
  const servicesViewport = document.getElementById('services-carousel-viewport');
  const servicesPrevBtn = document.getElementById('services-carousel-prev');
  const servicesNextBtn = document.getElementById('services-carousel-next');
  const servicesDots = Array.from(document.querySelectorAll('.services-dot'));

  if (servicesTrack && servicesViewport) {
    const originalCards = Array.from(servicesTrack.querySelectorAll('.sites-service-card'));
    const totalOriginal = originalCards.length;

    if (totalOriginal > 0) {
      // Clonar cards para carrusel infinito continuo (2 antes y 2 después)
      const clonesBefore = [
        originalCards[totalOriginal - 2].cloneNode(true),
        originalCards[totalOriginal - 1].cloneNode(true)
      ];
      const clonesAfter = [
        originalCards[0].cloneNode(true),
        originalCards[1].cloneNode(true)
      ];

      clonesBefore.forEach(c => {
        c.classList.add('is-clone');
        servicesTrack.insertBefore(c, servicesTrack.firstChild);
      });

      clonesAfter.forEach(c => {
        c.classList.add('is-clone');
        servicesTrack.appendChild(c);
      });

      const allCards = Array.from(servicesTrack.querySelectorAll('.sites-service-card'));
      const offsetCount = clonesBefore.length; // 2
      let currentTrackIndex = offsetCount; // Inicia en Card 0 original (track index 2)
      let autoSlideInterval = null;
      const AUTO_SLIDE_DELAY = 3800; // 3.8s
      let isTransitioning = false;

      const getRealIndex = (trackIdx) => {
        let idx = (trackIdx - offsetCount) % totalOriginal;
        if (idx < 0) idx += totalOriginal;
        return idx;
      };

      const updateServiceCarousel = (animate = true) => {
        const activeCard = allCards[currentTrackIndex];
        if (!activeCard) return;

        // Centrar exactamente la tarjeta activa en el medio del viewport
        const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
        const viewportCenter = servicesViewport.offsetWidth / 2;
        const targetTranslate = viewportCenter - cardCenter;

        const transitionValue = animate 
          ? 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)' 
          : 'none';
        const cardTransitionValue = animate 
          ? 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease, box-shadow 0.5s ease, border-color 0.4s ease' 
          : 'none';

        if (animate) {
          isTransitioning = true;
        } else {
          isTransitioning = false;
        }

        servicesTrack.style.transition = transitionValue;
        servicesTrack.style.transform = `translateX(${targetTranslate}px)`;

        // Actualizar trayectoria circular 3D y escala de las tarjetas
        allCards.forEach((card, idx) => {
          const offset = idx - currentTrackIndex;
          card.style.transition = cardTransitionValue;

          if (offset === 0) {
            // Centro de la trayectoria circular: posición frontal y destacada
            card.classList.add('active');
            card.style.transform = 'perspective(1100px) rotateY(0deg) translateZ(0px) translateY(0px) scale(1.04)';
            card.style.opacity = '1';
            card.style.zIndex = '5';
          } else if (offset === -1) {
            // Tarjeta izquierda curvada en la trayectoria semicircular
            card.classList.remove('active');
            card.style.transform = 'perspective(1100px) rotateY(15deg) translateZ(-45px) translateY(10px) scale(0.91)';
            card.style.opacity = '0.65';
            card.style.zIndex = '3';
          } else if (offset === 1) {
            // Tarjeta derecha curvada en la trayectoria semicircular
            card.classList.remove('active');
            card.style.transform = 'perspective(1100px) rotateY(-15deg) translateZ(-45px) translateY(10px) scale(0.91)';
            card.style.opacity = '0.65';
            card.style.zIndex = '3';
          } else {
            // Tarjetas lejanas fuera del arco visible (profundidad en el círculo)
            card.classList.remove('active');
            const rotY = offset < 0 ? 28 : -28;
            card.style.transform = `perspective(1100px) rotateY(${rotY}deg) translateZ(-110px) translateY(24px) scale(0.80)`;
            card.style.opacity = '0';
            card.style.zIndex = '1';
          }
        });

        // Actualizar indicadores (dots)
        const realIdx = getRealIndex(currentTrackIndex);
        servicesDots.forEach((dot, idx) => {
          if (idx === realIdx) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      };

      // Manejar salto silencioso infinito al terminar la transición
      servicesTrack.addEventListener('transitionend', () => {
        isTransitioning = false;
        // Si llegamos a los clones del final
        if (currentTrackIndex >= offsetCount + totalOriginal) {
          currentTrackIndex = currentTrackIndex - totalOriginal;
          updateServiceCarousel(false);
        }
        // Si llegamos a los clones del principio
        else if (currentTrackIndex < offsetCount) {
          currentTrackIndex = currentTrackIndex + totalOriginal;
          updateServiceCarousel(false);
        }
      });

      const nextServiceSlide = () => {
        if (isTransitioning) return;
        currentTrackIndex++;
        updateServiceCarousel(true);
      };

      const prevServiceSlide = () => {
        if (isTransitioning) return;
        currentTrackIndex--;
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
          currentTrackIndex = idx + offsetCount;
          updateServiceCarousel(true);
          startAutoSlide();
        });
      });

      // Clic en cualquier tarjeta lateral para llevarla al centro
      allCards.forEach((card, idx) => {
        card.addEventListener('click', (e) => {
          if (currentTrackIndex !== idx) {
            e.preventDefault();
            currentTrackIndex = idx;
            updateServiceCarousel(true);
            startAutoSlide();
          }
        });
      });

      // Pausar al pasar el mouse por encima
      const carouselWrapper = document.querySelector('.sites-services-carousel-wrapper');
      if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', stopAutoSlide);
        carouselWrapper.addEventListener('mouseleave', startAutoSlide);
      }

      // Soporte táctil / Swipe
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
        if (Math.abs(diffX) > 35) {
          if (diffX > 0) {
            nextServiceSlide();
          } else {
            prevServiceSlide();
          }
        }
        startAutoSlide();
      });

      // Redimensionamiento de ventana
      window.addEventListener('resize', () => {
        updateServiceCarousel(false);
      }, { passive: true });

      // Inicializar centrado y auto-play
      setTimeout(() => {
        updateServiceCarousel(false);
        startAutoSlide();
      }, 100);
    }
  }

});
