// What each number of the admin panel means, in plain words. These texts show in the hover of every chart and in the dialog of every
// card. Keep them accurate: they are the only place a reader learns how a figure was calculated.

export const EXPLAIN = {
  users:
    "Todas las cuentas registradas, incluidas las de prueba y la de administración. Las altas de 7 y 30 días son las cuentas creadas en ese lapso.",
  newInRange:
    "Cuentas creadas dentro del periodo elegido (7, 30 o 90 días), contando hasta hoy.",
  activation:
    "De las personas que se registraron en el periodo, el porcentaje que guardó su primera transacción propia dentro de los 7 días siguientes a su alta. Un porcentaje bajo significa que se registran pero no llegan a usar la app.",
  mau:
    "Personas distintas que guardaron al menos una transacción propia en los últimos 30 días.",
  wau:
    "Personas distintas que guardaron al menos una transacción propia en los últimos 7 días.",
  stickiness:
    "De cada 100 personas activas en el mes, cuántas volvieron a guardar algo durante la última semana. Entre más alto, más hábito tiene la app.",
  transactions:
    "Transacciones propias de todas las cuentas. No cuentan la transacción de bienvenida que Gastify crea al registrarse ni las categorías, cuentas y presupuestos iniciales.",
  transactionsPerUser:
    "Cuántas transacciones propias tiene cada persona. El cero no es un error: son cuentas que se registraron y todavía no han guardado ninguna transacción propia (solo tienen la de bienvenida). Esa transacción no se cuenta aquí.",
  zeroBucket:
    "Personas que se registraron y todavía no han guardado ninguna transacción propia. Tienen solo la transacción de bienvenida que Gastify crea automáticamente.",
  signupsByDay:
    "Cuentas creadas cada día, en horario UTC. Una columna por día; pasa el cursor para ver la fecha y el número.",
  transactionsByDay:
    "Transacciones propias guardadas cada día, en horario UTC. Una columna por día; pasa el cursor para ver la fecha y el número.",
  retention:
    "Cada fila es una semana de altas. Cada columna mide, de las personas que se registraron esa semana, cuántas guardaron una transacción propia en su semana N después del alta (semana 1 = días 7 a 13, semana 2 = días 14 a 20, semana 4 = días 28 a 34). Un '—' significa que la ventana todavía no termina para ninguna persona de esa semana.",
  weeklyActive:
    "Personas distintas con al menos una transacción propia en cada semana (de lunes a domingo, UTC).",
  snapshots:
    "Un punto por día con el total de usuarios, guardado cada vez que se abre el panel. Su historia se llena con el tiempo: el primer día solo hay un punto.",
  addedData:
    "Personas que guardaron una transacción propia durante el lapso indicado.",
  sessions:
    "Personas que usaron la app (una sesión que pasó la verificación) en el lapso. Las sesiones se borran al vencer o al cerrar sesión, así que las cifras de días pasados pueden quedarse cortas.",
  created:
    "Cuántos registros de cada tipo existen en la plataforma, sin contar los que Gastify crea de inicio para cada cuenta.",
  access:
    "Cómo entra cada cuenta: con Google, con contraseña, o con ambas. Passkey y verificación en dos pasos cuentan a quien los tiene activados. Un token de API sirve a los agentes de IA.",
  usageEvents:
    "Veces que ocurrió cada evento durante el periodo: visitas a la billetera, cargas de plantilla de Excel y llamadas de agentes de IA (MCP). Son contadores diarios, no se sabe quién los hizo.",
  routes:
    "Tiempos de las rutas de API medidos en el servidor. p50 es la mediana: la mitad de las peticiones tarda menos que eso. p95: 95 de cada 100 peticiones tardan menos. Los valores son aproximados porque se guardan en rangos de tiempo.",
  errorRate:
    "Porcentaje de peticiones que terminaron en error del servidor (código 5xx) o que lanzaron una excepción.",
  lcp:
    "Largest Contentful Paint: cuánto tarda en aparecer el contenido principal de la página. Buena: hasta 2.5 s. Mala: más de 4 s.",
  inp:
    "Interaction to Next Paint: cuánto tarda la página en responder a un clic o a una tecla. Buena: hasta 200 ms. Mala: más de 500 ms.",
  cls:
    "Cumulative Layout Shift: cuánto se mueven los elementos mientras la página carga. Bueno: hasta 0.1. Malo: más de 0.25.",
  vitalsSample:
    "Solo se mide una cuarta parte de las visitas, de personas con sesión iniciada. Las mediciones se envían cuando se sale de la página.",
  revenue:
    "Cuentas por plan. Gastify todavía no cobra: todas están en Gratis, salvo que el campo de plan diga Pro. El ingreso solo se calcula cuando se define el precio.",
  deleteAccount:
    "Borrar la cuenta quita la persona, su billetera, sus cuentas bancarias de la app, sus transacciones, categorías, presupuestos, etiquetas y sus sesiones. No se puede deshacer. Queda una línea en la auditoría con la fecha y el número de registros borrados.",
} as const;
