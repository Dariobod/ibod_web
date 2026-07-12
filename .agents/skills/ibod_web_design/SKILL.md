---
name: ibod_web_design
description: Guidelines and instructions for maintaining, editing, and extending the iBod Web Design System, layout mechanics, and animations.
---
# iBod Web Design System & Skill Guide

Use this skill when modifying or expanding the iBod One-Page video editing agency website. It details variables, components, scroll animations, performance precautions, and brand guidelines to ensure visual consistency.

## Color Tokens & Variables
* Primary Accent: `#028ee0` (iBod Brand Blue)
* Glow Accent: `rgba(2, 142, 224, 0.1)`
* Border Accent: `rgba(2, 142, 224, 0.25)`
* Page Background (Primary): `#070709` (Dark space charcoal)
* Card Background (Secondary): `#0e0e13` (Deep matte gray)
* Status Dot (Neon Green): `#1aff75`
* Solid Black: `#000000` (Used for section tag pills)

## Typography
* Heading Display Font: `Outfit` (sans-serif)
* Text Body Font: `Inter` (sans-serif)

## Core Interaction Mechanics

### 1. Stacking Cards Scroll Animation
* Parent Container: `.services-list` (Flex vertical stack)
* Card Element: `.service-card` (Sticky top: 140px, height: 480px)
* Stacking order: `z-index: 1` through `z-index: 4`.
* Scale & Darkness (Inertial Scroll): 
  - Prevents layout thrashing by caching `offsetTop` in `cardOffsets` on load/resize.
  - Scales previous cards from `1.0` to `0.95` with origin `center top`.
  - Dims brightness from `1.0` to `0.7` (`filter: brightness(0.7)`) as the next card stacks on top.
  - Reset styles on screens under `768px` (sticky and scale are disabled).

### 2. Smooth Scrolling & Lenis
* Integrated via CDN.
* Global scroll: initialized with `duration: 1.4` and `easeOutExpo` easing for manual scrolls.
* Local Link Clicks: custom scrolling handled via `lenis.scrollTo(target, { offset: -110, duration: 1.6, easing: easeOutQuint })`.
* CSS Conflict Avoidance: `scroll-behavior: smooth` is removed from `html` tag to prevent scrolling fights.

### 3. Before/After Colorization Slider
* Recalculates slider percentage inside `.slider-wrapper`.
* Clip mask: adjusts `.img-before` using `clip-path: inset(0 ${100 - X}% 0 0)`.
* Handle: updates `.slider-handle` and `.slider-line` left positions to `X%`.

### 4. Custom Section Headers
* Label `.section-tag` has a solid black background (`#000000`), rounded pill shape, blue border, and blue text.

## Rule Guidelines
- Do NOT insert native `scroll-behavior` rules.
- Do NOT call `getBoundingClientRect()` inside a `scroll` listener; always cache offsets or read raw scroll properties.
- Maintain capsule styling (`border-radius: 100px`) on all primary buttons and links.
