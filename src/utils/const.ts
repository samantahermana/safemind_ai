
export const HIGH_RISK_KEYWORDS = [
  'secreto', 'secretito', 'ocultar', 'esconder',
  'desnudo', 'desnuda', 'sin ropa',
  'bloquear', 'bloqueas', 'publicar', 'subir fotos',
  'no cuentes', 'no digas', 'no avises', 'no vayas a decir',
  'conocernos', 'vernos', 'encontrarnos',
  'maduro para tu edad', 'madura para tu edad',
  'especial diferente', 'distinta a los demás',
  'fotito', 'fotitos', 'videito', 'videitos',
  'mensajito', 'mensajitos', 'regalito', 'regalitos',
  'me enojo', 'me ofendo', 'me voy a enojar',
  'prometiste', 'dijiste que', 'prometí',
  'sabes lo que tengo', 'todo lo que tengo', 'tengo tuyo'
];

export const SUSPICIOUS_PATTERNS = [
  /no (le |les )?(digas|cuentes|comentes|vayas a decir)/i,
  /entre (vos y yo|nosotros|tú y yo)/i,
  /(manda|mandam[eé]|envia|enviame|pasa|pasam[eé]).+(foto|fotito|fotitos|video|videito|videitos|imagen)/i,
  /(te |me )?gusta.+(cuerpo|foto|verse)/i,
  /veni.+(solo|sola|casa|encuentro)/i,
  /(sos|eres|te ves).+(linda|hermosa|bonita|sexy)/i,
  /esto.+(secreto|secretito|privado|nuestro)/i,
  /(foto|video|imagen)(s)?(ito|ita|itos|itas)/i,
  /(manda|envia|pasa).+(mensajito|regalito)/i,
  /(prometiste|dijiste|prometí).+(foto|video|manda|envia)/i,
  /(o|si no).+(me enojo|me ofendo|me voy|subo|publico|muestro)/i,
  /(sabes|sabés).+(todo lo que tengo|lo que tengo tuyo)/i,
  /no.+(se la (muestro|voy a mostrar|paso)).+nadie/i
];

// Patrones de mensajes benignos comunes
export const BENIGN_PATTERNS = [
  /^hola+[\s!?]*$/i,
  /^(hola|hey|hi)[\s,]+[a-záéíóúñ]+[\s!?]*$/i,
  /^(gracias|thanks|thx)/i,
  /^de nada/i,
  /^(buenos días|buen día|buenas|buenas tardes|buenas noches)/i,
  /^(chau|adiós|hasta luego|nos vemos)/i,
  /llamada (entrante|saliente|perdida)/i,
  /^(ok|okay|dale|bien|genial|joya|re bien|todo bien)/i,
  /^(qué tal|cómo estás|cómo andás|todo bien|cómo va)/i,
  /la pasamos (lindo|bien|genial|re bien|muy bien)/i,
  /🔗.*(instagram|facebook|twitter|tiktok)/i
];

// Palabras de contexto seguro (familiar/escolar/cotidiano)
export const SAFE_CONTEXT_KEYWORDS = [
  'tarea', 'tareas', 'deber', 'deberes', 'clase', 'clases',
  'profesor', 'profe', 'maestra', 'maestro', 'docente',
  'mamá', 'mama', 'papá', 'papa', 'padres', 'familia', 'hermano', 'hermana',
  'escuela', 'colegio', 'instituto', 'universidad',
  'examen', 'prueba', 'evaluación', 'trabajo práctico',
  'proyecto', 'presentación', 'estudio', 'estudiar',
  'cumpleaños', 'fiesta', 'reunión', 'juntada',
  'deporte', 'fútbol', 'básquet', 'entrenamiento',
  'libro', 'lectura', 'película', 'serie', 'juego', 'videojuego'
];

