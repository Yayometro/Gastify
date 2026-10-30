# PLAN F3 — Animación de «energía» en las barras de presupuestos

Autor: Sonnet 5.5. Implementa: Haiku 5.5. Pedido del dueño (2026-10-30): «que las barras de los budgets tengan una animación, como una energía que pase de izquierda a derecha en las barras, o algún tipo de animación dentro de lo que ya está lleno de las barritas».

## 1. Diseño visual
- Un brillo suave (franja diagonal translúcida, ancho ≈ 28% de la barra llena, blanco al 28% de opacidad con bordes difuminados) que recorre **solo la parte llena** de la barra, de izquierda a derecha, en bucle: duración 2.8 s, easing `ease-in-out`, pausa de 1.2 s entre pasadas (delay en el keyframe). No debe salir de la parte llena ni tapar el círculo de porcentaje de la punta.
- Respeta el color de la barra (verde/ámbar/rojo del estado): el brillo es blanco translúcido, no cambia el color.
- Intensidad por estado: barra casi vacía (<3 %) sin animación; estados «excedido» (rojo) con pasada más rápida (2.0 s) para transmitir urgencia; ahorros/proyectos igual que gasto.
- Accesibilidad: `@media (prefers-reduced-motion: reduce)` → sin animación (brillo estático tenue o nada). En móvil: `AccessibilityInfo.isReduceMotionEnabled()`.
- Rendimiento: solo `transform`/`opacity` (nada de animar `width`/`left`); con muchas barras en pantalla, un único keyframe CSS compartido; en móvil `react-native-reanimated` (ya en el proyecto: confirmar con `apps/mobile/package.json`) con `useSharedValue` + `withRepeat`, `useNativeDriver`/worklets; pausar fuera de pantalla si es sencillo.

## 2. Dónde
Web: la barra de las tarjetas de presupuesto (`src/components/multiUsedComp/BudgetCont.tsx`, `Budgets/BudgetsClient.tsx`), de ahorro y de proyecto; el modal de detalle (`Budgets/BudgetDetailModal.tsx` y `ProjectBudgetDetailModal.tsx`); barra de la home (`HomeProductRenders`/demo) si reutiliza el mismo componente. Extraer un componente `BudgetBarFill` compartido (o una clase CSS `gf-bar-energy`) en vez de duplicar. Móvil: `apps/mobile/src/components/budget-progress.tsx` (`BudgetProgress`) + las barras de `home/budgets-widget.tsx` y `budgets/*`.

## 3. Implementación sugerida (web)
CSS en `globals.css`: `@keyframes gf-energy { 0%{transform:translateX(-120%)} 60%,100%{transform:translateX(320%)} }` y una clase aplicada a un `span` absoluto dentro del contenedor de la parte llena (`position:relative; overflow:hidden; border-radius:inherit`), `pointer-events:none`, con un `linear-gradient(105deg, transparent, rgba(255,255,255,.28), transparent)`. Tema claro: mismo brillo pero con `mix-blend-mode: soft-light` o opacidad ajustada para que se vea sobre el relleno (verificar contraste visual). No tocar tokens existentes.

## 4. Criterios de aceptación
1. Web: se ve el brillo recorriendo la barra llena en Presupuestos (gasto, ahorro, proyecto) en oscuro y claro; no sale de la parte llena; el círculo de % queda por encima; con `prefers-reduced-motion` (emular en DevTools: `Emulation.setEmulatedMedia`) no hay animación.
2. Barra <3 % o vacía: sin animación. Excedida: pasada más rápida.
3. Móvil (emulador Android, `scripts/emu.sh`): la animación corre sin tirones en la lista de presupuestos y la home; con «Quitar animaciones» del sistema se detiene (`adb shell settings put global animator_duration_scale 0` para probar).
4. CPU: abrir Presupuestos con ≥ 8 barras no sube el uso de CPU de forma apreciable (medir con DevTools Performance 5 s; transform-only → composited).
5. tsc raíz y móvil, eslint, vitest verdes; sin cambios en el layout (medir altura de la tarjeta antes/después).

## 5. Entrega
H1 web + CSS + tests de componente donde existan · H2 móvil. Sin dependencias nuevas.
