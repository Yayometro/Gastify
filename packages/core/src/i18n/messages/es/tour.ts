// Texts of the "tour" namespace (the guided tutorial). Spanish is the source text.
// Every step of packages/core/src/tour/tourSteps.ts has a `tour.<step id>.title` and a `tour.<step id>.body`.
const tour = {
  // The buttons and labels of the tour itself.
  "tour.ui.next": "Siguiente",
  "tour.ui.prev": "Atrás",
  "tour.ui.done": "Listo",
  "tour.ui.close": "Cerrar tutorial",
  "tour.ui.progress": "{p1} de {p2}",
  "tour.ui.progressOpen": "Paso {p1}",
  "tour.ui.nextSection": "Siguiente sección",
  "tour.ui.fullTour": "Recorrido completo",
  "tour.ui.sectionOf": "Sección {p1} de {p2}",
  "tour.ui.button": "Tutorial",
  "tour.ui.hint": "Recorridos guiados: de esta página o de toda la app.",

  // The menu that opens from the Tutorial button.
  "tour.menu.title": "Tutorial",
  "tour.menu.subtitle": "Elige cómo quieres recorrer Gastify.",
  "tour.menu.page": "Esta página",
  "tour.menu.pageHint": "Te muestro lo más importante de lo que ves ahora.",
  "tour.menu.basics": "Cómo moverte",
  "tour.menu.basicsHint": "La barra de navegación y los botones principales.",
  "tour.menu.full": "Recorrido completo",
  "tour.menu.fullHint": "Pasamos por todas las secciones, una por una.",
  "tour.menu.noPage": "Esta página no tiene tutorial propio, pero puedes hacer el recorrido completo.",
  "tour.menu.components": "Tutoriales a fondo de esta página",
  "tour.menu.componentsHint": "Cada sección, control por control.",
  "tour.menu.close": "Cerrar",

  // The buttons that open a tutorial from a title ("Tutorial: Importar desde Excel").
  "tour.tip.label": "Tutorial: {p1}",

  // The cards that teach the help buttons: the first ones of the welcome and of every page.
  "tour.common.infoTip.title": "Los signos de pregunta (?)",
  "tour.common.infoTip.body": "Cada «?» explica lo que tienes enfrente: qué significa un número, de dónde sale y cómo se calcula. Tócalo (o pasa el cursor) siempre que algo no te quede claro: es la forma más rápida de entender Gastify.",
  "tour.common.tutorialTip.title": "Botones de tutorial",
  "tour.common.tutorialTip.body": "Este botón con brújula inicia el tutorial paso a paso de esta página. Junto al título de cada sección hay otro igual: te explica esa sección a fondo, control por control.",

  // The names of the sections, for "Sección 3 de 9: Presupuestos".
  "tour.page.intro": "Bienvenida",

  // Bienvenida: how to move around.
  "tour.intro.welcome.title": "Bienvenido a Gastify",
  "tour.intro.welcome.body": "Te muestro en un minuto cómo moverte: dónde está cada sección y cómo registrar un movimiento. Puedes salir cuando quieras con Esc o con la X.",
  "tour.intro.bar.title": "Tu barra de navegación",
  "tour.intro.bar.body": "Cada ícono te lleva a una sección: Movimientos, Cartera, Presupuestos, Proyecciones, Analizador, Cuentas, Historial y Categorías. En el celular, la flecha de la barra abre el resto.",
  "tour.intro.add.title": "Registra un movimiento",
  "tour.intro.add.body": "El botón “+” crea un gasto, un ingreso, una transferencia, una cuenta o un presupuesto. Empezar por aquí es lo más útil: tu panorama se arma solo.",
  "tour.intro.notifications.title": "Tus avisos",
  "tour.intro.notifications.body": "Aquí llegan los avisos de tus presupuestos cuando se acercan al límite: al 70, 80, 90 y 100 %.",
  "tour.intro.profile.title": "Tu perfil",
  "tour.intro.profile.body": "Tu foto, tu idioma, tu país, el modo claro u oscuro, el tutorial (ábrelo cuando quieras desde aquí), la seguridad de tu cuenta y la conexión con tu IA viven aquí.",

  // Cartera (dashboard).

  // Movimientos.

  // Presupuestos.

  // Proyecciones.

  // Analizador de cartera.

  // Cuentas.

  // Historial.

  // Categorías.

  // Perfil.

  // The offer of the second session when the tutorial was left half way.
  "tour.resume.title": "Sigamos con tu tutorial",
  "tour.resume.text": "Te quedaste a la mitad del recorrido. ¿Quieres continuar donde lo dejaste o empezar de nuevo?",
  "tour.resume.continue": "Continuar donde me quedé",
  "tour.resume.restart": "Empezar de nuevo",
  "tour.resume.later": "Ahora no",
  "tour.resume.never": "No volver a mostrar",

  // The one-time notice for an account from before the tutorial.
  "tour.announce.title": "Nuevo: tutorial guiado",
  "tour.announce.text": "Gastify ahora te enseña cada sección paso a paso. Lo encuentras en el botón “?” de la barra y en tu Perfil.",
  "tour.announce.start": "Ver el recorrido completo",
  "tour.announce.dismiss": "Entendido",

  // The button on the demo's guide card.
  "tour.demoGuide.start": "Recorrido guiado",
  "tour.demoGuide.startLabel": "Iniciar el recorrido guiado de esta página",

  // The card of the profile (the Tutorial section).
  "tour.profileCard.title": "Tutorial",
  "tour.profileCard.text": "Repasa Gastify paso a paso, aunque ya la uses.",
  "tour.profileCard.full": "Ver el recorrido completo",
  "tour.profileCard.basics": "Repetir la bienvenida",
  "tour.profileCard.stop": "No mostrar el tutorial automáticamente",
  "tour.profileCard.stopped": "Listo: el tutorial ya no se abrirá solo. Puedes verlo cuando quieras.",
  "tour.profileCard.menu": "Abrir el menú del tutorial",
  "profile.appearance.title": "Apariencia",
  "profile.appearance.text": "Elige cómo se ve Gastify.",
  "profile.appearance.dark": "Oscuro",
  "profile.appearance.light": "Claro",
} as const;

export default tour;
