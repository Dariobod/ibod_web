# iBod Design System & Development Guide

Este documento contiene la especificación completa del sistema de diseño, la paleta de colores, la tipografía, los componentes y las mecánicas de interacción interactiva implementadas para el sitio web de **iBod**.

---

## 1. Paleta de Colores & Identidad

El sitio web utiliza un diseño premium en modo oscuro basado en los colores del logotipo de iBod:

| Elemento | Variable CSS | Valor | Descripción |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | `--bg-primary` | `#070709` | Gris carbón oscuro profundo para el fondo general del sitio. |
| **Fondo Secundario** | `--bg-secondary` | `#0e0e13` | Gris mate oscuro para tarjetas y bloques secundarios. |
| **Color de Marca (Azul)** | `--primary` | `#028ee0` | Azul iBod para acentos, enlaces y botones activos. |
| **Resplandor Azul** | `--primary-glow` | `rgba(2, 142, 224, 0.1)` | Azul translúcido para efectos traslúcidos de fondo. |
| **Borde Azul** | `--border-blue` | `rgba(2, 142, 224, 0.25)` | Bordes sutiles con tono de la marca. |
| **Borde Neutro** | `--border-primary` | `rgba(255, 255, 255, 0.08)` | Bordes finos grisáceos en tarjetas y divisores. |
| **Fondo de Etiquetas** | *(N/A)* | `#000000` | Negro absoluto utilizado para las píldoras de sección (`.section-tag`). |
| **Punto de Estado / Éxito** | *(N/A)* | `#1aff75` | Verde neón para el dot de disponibilidad y notificaciones de éxito. |

---

## 2. Tipografía

El sitio web utiliza Google Fonts para cargar fuentes geométricas y limpias:

* **Títulos y Encabezados**: `Outfit` (sans-serif)
  - Pesos recomendados: `700` (Bold) y `800` (Extra Bold).
  - Estilo: Moderno, geométrico y con un espaciado de letras ajustado (`letter-spacing: -0.02em`).
* **Textos de Cuerpo**: `Inter` (sans-serif)
  - Pesos recomendados: `400` (Regular) y `500` (Medium).
  - Estilo: Altamente legible con altura de línea de `1.6` a `1.8`.

---

## 3. Componentes de UI Clave

### Barra de Navegación Flotante (Capsule Navbar)
* Estructurada como una cápsula flotante centrada (`border-radius: 100px`, `backdrop-filter: blur(16px)`).
* Ocupa el `90%` del ancho en móviles y cambia a un menú de hamburguesa con animación de overlay vertical.

### Botones en Forma de Cápsula
* Todos los botones principales (`.btn`, `.service-btn`, `.about-btn`, etc.) tienen un `border-radius: 100px` para una consistencia visual perfecta con la barra de navegación.

### Etiquetas de Sección (`.section-tag`)
* Píldoras con fondo negro puro (`#000000`), borde azul translúcido, texto azul vibrante en mayúsculas sostenidas, y espaciado expandido (`letter-spacing: 0.1em`).

---

## 4. Mecánicas de Movimiento & Animaciones

### A. Tarjetas Apilables (Sticky Stacking Cards)
* **CSS**: Las tarjetas de servicios se definen como `position: sticky; top: 140px; height: 480px;` con un pivote superior `transform-origin: center top;`.
* **JS (Escalado Dinámico)**:
  - Para evitar caídas de rendimiento (*Layout Thrashing*), las posiciones absolutas (`offsetTop`) de las tarjetas se calculan **una sola vez** en la inicialización y en el redimensionamiento, guardándose en el arreglo `cardOffsets`.
  - Al hacer scroll, la tarjeta superior escala gradualmente hacia abajo de `1.0` a `0.95` y disminuye su brillo a `0.7` (`brightness(0.7)`) a medida que la siguiente tarjeta sube para apilarse sobre ella.
  - En móviles (`width < 768px`), las propiedades `sticky` y de escala se desactivan para permitir el flujo natural de lectura vertical.

### B. Desplazamiento Suave (Lenis)
* El sitio web utiliza la biblioteca de scroll inercial **Lenis** para manuales de scroll con rueda de ratón o trackpad, logrando una deceleración progresiva inercial tipo Apple (`duration: 1.4` y `easeOutExpo`).
* Para evitar comportamientos erráticos, se remueve `scroll-behavior: smooth` del archivo CSS.
* Los clics de navegación se realizan mediante la API `lenis.scrollTo()` con un frenado progresivo de 1.6 segundos (`easeOutQuint`) y un desfase de `-110px` para no solapar la barra de navegación flotante.

### C. Deslizador Antes/Después
* Utiliza un contenedor relativo (`.slider-wrapper`) donde la imagen del "Antes" tiene un estilo dinámico de `clip-path: inset(0 ${100 - X}% 0 0)`.
* El tirador de arrastre (`.slider-handle`) y la línea vertical (`.slider-line`) se mueven horizontalmente al porcentaje `X%` escuchando eventos táctiles y de ratón.

---

## 5. Rama de Producción & Despliegues
* **Rama Principal**: La rama oficial de producción para los despliegues automáticos en Cloudflare es **`master`**.
* **Despliegue**: Asegúrate de estar en la rama `master` y ejecutar `git push origin master` para lanzar cualquier cambio probado a producción.

## 5. Reglas para Futuras Modificaciones

1. **Evitar Reflows en Scroll**: No utilices `getBoundingClientRect()` dentro del listener de scroll global. Lee en su lugar propiedades directas (`window.scrollY`) u offsets precalculados.
2. **Estilo Redondeado**: Cualquier nuevo botón de acción o enlace interactivo principal debe seguir la convención de píldora redondeada (`border-radius: 100px`).
3. **Compatibilidad Lenis**: Al interactuar con la posición de desplazamiento de la ventana, interactúa directamente a través de la instancia global de `lenis` para mantener la fluidez del movimiento inercial.
