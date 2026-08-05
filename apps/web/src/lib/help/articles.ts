// ============================================
// THRYRA — Contenido del Centro de Ayuda
// ============================================

export type HelpRole = 'coach' | 'athlete' | 'admin'

export interface HelpStep {
  title: string
  body: string
}

export interface HelpArticle {
  id: string
  title: string
  summary: string
  category: HelpCategoryId
  roles: HelpRole[]
  keywords: string[]
  steps: HelpStep[]
  tips?: string[]
}

export type HelpCategoryId =
  | 'primeros-pasos'
  | 'atletas'
  | 'rutinas'
  | 'wods'
  | 'programacion'
  | 'herramientas'
  | 'equipo'

export interface HelpCategory {
  id: HelpCategoryId
  label: string
  description: string
  icon: string
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'primeros-pasos', label: 'Primeros pasos',  description: 'Lo básico para empezar a usar Thryra', icon: 'Rocket' },
  { id: 'atletas',        label: 'Atletas',          description: 'Gestionar tu cartera de atletas',      icon: 'Users' },
  { id: 'rutinas',        label: 'Rutinas',          description: 'Crear y asignar planes de entrenamiento', icon: 'Dumbbell' },
  { id: 'wods',           label: 'WODs',             description: 'Workouts del día y cronómetros',       icon: 'Zap' },
  { id: 'programacion',   label: 'Programación',     description: 'Planificar la semana del box',         icon: 'ClipboardList' },
  { id: 'herramientas',   label: 'Herramientas',     description: 'Calculadora, PRs, timer y ejercicios', icon: 'Percent' },
  { id: 'equipo',         label: 'Equipo y accesos', description: 'Invitaciones, roles y grupos',         icon: 'UserCog' },
]

export const HELP_ARTICLES: HelpArticle[] = [

  /* ─────────────── PRIMEROS PASOS ─────────────── */

  {
    id: 'que-es-thryra',
    title: '¿Qué es Thryra y cómo se organiza?',
    summary: 'Un recorrido rápido por las secciones principales de la plataforma.',
    category: 'primeros-pasos',
    roles: ['coach', 'athlete', 'admin'],
    keywords: ['inicio', 'introducción', 'menú', 'navegación', 'secciones'],
    steps: [
      {
        title: 'El menú lateral es tu punto de partida',
        body: 'Todo se navega desde la barra lateral izquierda. En móvil se abre con el botón de menú arriba a la izquierda. Lo que ves ahí depende de tu rol: un coach ve la gestión de atletas y rutinas, un atleta ve sus rutinas asignadas y sus registros.',
      },
      {
        title: 'Dashboard: el resumen de tu día',
        body: 'Es la primera pantalla al entrar. Si eres coach, muestra cuántos atletas tienes activos, sesiones de la semana y quién lleva días sin entrenar. Si eres atleta, muestra tu próxima sesión y tus rutinas asignadas.',
      },
      {
        title: 'Rutinas y WODs son cosas distintas',
        body: 'Una rutina es un plan estructurado en bloques (calentamiento, fuerza, WOD, accesorios). Un WOD es un workout suelto con su propio formato y cronómetro (AMRAP, For Time, EMOM…). Puedes usar ambos o solo uno.',
      },
      {
        title: 'Programación conecta todo con el calendario',
        body: 'Desde Programación asignas qué rutina o WOD toca cada día de la semana, y a qué grupo. Eso es lo que tus atletas ven en su calendario.',
      },
    ],
    tips: [
      'Puedes cambiar entre modo claro y oscuro desde el botón al final del menú lateral.',
      'El logo de arriba siempre te lleva de vuelta al Dashboard.',
    ],
  },

  {
    id: 'configurar-perfil',
    title: 'Configurar tu perfil y tu box',
    summary: 'Ajusta tus datos, el nombre de tu organización y tus preferencias.',
    category: 'primeros-pasos',
    roles: ['coach', 'athlete', 'admin'],
    keywords: ['perfil', 'configuración', 'cuenta', 'datos', 'box', 'organización'],
    steps: [
      {
        title: 'Abre Configuración',
        body: 'Al final del menú lateral encontrarás "Configuración". Ahí están tus datos personales: nombre, teléfono, nacionalidad y foto de perfil.',
      },
      {
        title: 'Actualiza tus datos y guarda',
        body: 'Modifica los campos que necesites y presiona Guardar. Los cambios se reflejan de inmediato en toda la plataforma, incluido cómo te ven tus atletas.',
      },
      {
        title: 'Datos del box (solo administradores)',
        body: 'Si eres administrador, también verás la configuración de la organización: nombre del box y logo. Esto es lo que aparece para todos los usuarios de tu equipo.',
      },
    ],
  },

  /* ─────────────── ATLETAS ─────────────── */

  {
    id: 'agregar-atleta',
    title: 'Agregar un atleta nuevo',
    summary: 'Crea la ficha de un atleta para poder asignarle rutinas y hacer seguimiento.',
    category: 'atletas',
    roles: ['coach', 'admin'],
    keywords: ['atleta', 'agregar', 'crear', 'nuevo', 'alumno', 'cliente'],
    steps: [
      {
        title: 'Ve a Atletas y presiona "Nuevo atleta"',
        body: 'El botón está arriba a la derecha de la pantalla. Se abre un formulario con los datos básicos.',
      },
      {
        title: 'Completa los datos mínimos',
        body: 'Nombre y apellido son obligatorios. El email es opcional pero muy recomendado: es lo que te permitirá invitarlo después para que acceda con su propia cuenta.',
      },
      {
        title: 'Agrega información deportiva y médica',
        body: 'Deporte principal, nivel (principiante a competitivo), peso, altura, lesiones y restricciones. Esto te sirve para adaptar las cargas y evitar movimientos contraindicados.',
      },
      {
        title: 'Guarda',
        body: 'El atleta queda automáticamente asignado a ti como coach. Aparecerá en tu lista y podrás asignarle rutinas de inmediato.',
      },
    ],
    tips: [
      'Solo ves los atletas que tú creaste o que te fueron asignados. Los de otros coaches no aparecen en tu lista.',
      'Crear la ficha del atleta no le da acceso a la plataforma. Para eso necesitas invitarlo por email (ver "Invitar usuarios").',
    ],
  },

  {
    id: 'ficha-atleta',
    title: 'Revisar la ficha y el progreso de un atleta',
    summary: 'Todo el historial, mediciones y rutinas de un atleta en un solo lugar.',
    category: 'atletas',
    roles: ['coach', 'admin'],
    keywords: ['ficha', 'detalle', 'progreso', 'historial', 'mediciones', 'seguimiento'],
    steps: [
      {
        title: 'Entra al atleta desde la lista',
        body: 'En Atletas, haz clic sobre la tarjeta del atleta que quieres revisar.',
      },
      {
        title: 'Revisa sus datos y rutinas asignadas',
        body: 'La ficha muestra sus datos personales, deportivos y médicos, junto con las rutinas que le has asignado y su historial de sesiones completadas.',
      },
      {
        title: 'Registra mediciones corporales',
        body: 'Puedes ir guardando peso, porcentaje de grasa, masa muscular y fotos de progreso con fecha. Esto construye la línea de tiempo del atleta.',
      },
      {
        title: 'Consulta sus PRs',
        body: 'Desde la Calculadora puedes seleccionar a este atleta y ver o registrar sus marcas personales en cada movimiento.',
      },
    ],
  },

  /* ─────────────── RUTINAS ─────────────── */

  {
    id: 'crear-rutina',
    title: 'Crear una rutina desde cero',
    summary: 'El flujo completo: crear la rutina, armar los bloques y asignarla.',
    category: 'rutinas',
    roles: ['coach', 'admin'],
    keywords: ['rutina', 'crear', 'nueva', 'plan', 'entrenamiento', 'programa'],
    steps: [
      {
        title: 'Ve a Rutinas y presiona "Nueva rutina"',
        body: 'Ponle un nombre claro (por ejemplo "Fuerza — Semana 3" o "CrossFit Lunes"), una descripción opcional y elige el tipo: Fuerza, Hipertrofia, Cardio, CrossFit, Halterofilia, Kinesiología, Rehabilitación, General u Otro.',
      },
      {
        title: 'Marca "Plantilla" si la vas a reutilizar',
        body: 'Las rutinas marcadas como plantilla te sirven de base para duplicar estructuras que repites seguido, sin tener que armarlas de nuevo cada semana.',
      },
      {
        title: 'Al guardar entras directo al constructor',
        body: 'Thryra te lleva automáticamente a la pantalla donde armas los bloques. Ahí es donde ocurre el trabajo real.',
      },
      {
        title: 'Agrega tus bloques',
        body: 'Presiona "Agregar bloque" tantas veces como necesites — no hay límite. Un entrenamiento puede tener 3 bloques o 8, tú decides. Revisa el artículo "Armar bloques" para el detalle de cada tipo.',
      },
      {
        title: 'Asigna la rutina a tus atletas',
        body: 'Con el botón "Asignar atletas" arriba a la derecha eliges a quién le llega. Puedes seleccionar varios a la vez. Ellos la verán en su sección "Mis Rutinas".',
      },
    ],
    tips: [
      'Los atletas solo ven las rutinas que les asignaste explícitamente, no todas las de tu box.',
    ],
  },

  {
    id: 'armar-bloques',
    title: 'Armar los bloques de una rutina',
    summary: 'Calentamiento, fuerza, WOD, EMOM: cómo se configura cada tipo de bloque.',
    category: 'rutinas',
    roles: ['coach', 'admin'],
    keywords: ['bloques', 'wod', 'emom', 'amrap', 'calentamiento', 'fuerza', 'estructura', 'partes'],
    steps: [
      {
        title: 'Cada bloque es una parte del entrenamiento',
        body: 'Una clase típica de CrossFit se divide en partes: primero calentamiento, después trabajo de fuerza, después el WOD. Cada una de esas partes es un bloque en Thryra, y se ejecutan en el orden en que las agregas.',
      },
      {
        title: 'Elige el tipo de bloque',
        body: 'Presiona "Editar" en la cabecera del bloque y elige entre: Calentamiento, Fuerza, WOD, EMOM/Intervalos, Estándar, Superserie, Circuito, Accesorio o Vuelta a la calma. También puedes darle un nombre propio como "Parte A" o "Técnica de snatch".',
      },
      {
        title: 'Bloques de Fuerza y Calentamiento',
        body: 'Cada ejercicio se configura con series, repeticiones, peso en kilos, porcentaje de 1RM, descanso entre series y RPE. Usa el % de 1RM cuando quieras que la carga se adapte al nivel de cada atleta en lugar de fijar un peso absoluto.',
      },
      {
        title: 'Bloques de WOD',
        body: 'Al elegir tipo WOD aparece un panel donde defines el formato: AMRAP, For Time, EMOM, Tabata, Chipper, Intervalos u Otro. Además fijas el time cap en minutos y, si aplica, la cantidad de rondas. Los ejercicios dentro del WOD se configuran solo con repeticiones o distancia, peso y % de 1RM.',
      },
      {
        title: 'Bloques EMOM / Intervalos',
        body: 'Configuras segundos de trabajo, segundos de descanso y número de rondas. Thryra te calcula automáticamente el tiempo total del bloque para que sepas cuánto va a durar esa parte de la clase.',
      },
      {
        title: 'Especifica el implemento de cada ejercicio',
        body: 'Al editar un ejercicio encontrarás el selector "Implemento / Equipo": barra olímpica, mancuerna, kettlebell, disco, medicine ball, cajón, anillas, TRX, banda, cuerda, remo, ski erg, assault bike, sandbag, chaleco y más. Queda visible en el resumen del ejercicio para que el atleta sepa exactamente con qué trabajar.',
      },
    ],
    tips: [
      'Ejemplo de clase completa — Bloque 1 Calentamiento: 3 rondas de 10 inchworms + 200m trote. Bloque 2 Fuerza: Clean & Jerk 5×3 al 75% con barra. Bloque 3 WOD tipo AMRAP 12 min: 3 Clean & Jerk + 6 Bar Muscle-ups + 9 Box Jumps.',
      'Puedes eliminar un bloque con el ícono de basurero, pero se borran también todos sus ejercicios.',
    ],
  },

  {
    id: 'mis-rutinas-atleta',
    title: 'Ver y ejecutar tus rutinas asignadas',
    summary: 'Cómo encontrar tu entrenamiento del día y registrar lo que hiciste.',
    category: 'rutinas',
    roles: ['athlete'],
    keywords: ['mis rutinas', 'entrenar', 'sesión', 'registrar', 'ejecutar', 'atleta'],
    steps: [
      {
        title: 'Entra a "Mis Rutinas"',
        body: 'En el menú lateral encontrarás todas las rutinas que tu coach te asignó. Si está vacío, significa que aún no te han asignado ninguna — habla con tu coach.',
      },
      {
        title: 'Abre la rutina para ver el detalle',
        body: 'Verás los bloques en orden, con los ejercicios de cada uno: series, repeticiones, peso o porcentaje, descanso e implemento a usar. Si un bloque es un WOD, verás el formato y el time cap.',
      },
      {
        title: 'Registra tu sesión mientras entrenas',
        body: 'Al iniciar una sesión puedes ir marcando cada serie con el peso y las repeticiones que realmente hiciste. No tiene que coincidir con lo prescrito — el registro real es lo que le sirve a tu coach.',
      },
      {
        title: 'Marca tus PRs',
        body: 'Si logras una marca personal, márcala como PR. Queda guardada en tu historial y alimenta la calculadora de porcentajes.',
      },
    ],
  },

  /* ─────────────── WODS ─────────────── */

  {
    id: 'crear-wod',
    title: 'Crear un WOD',
    summary: 'Arma un workout del día con su formato, movimientos y cronómetro.',
    category: 'wods',
    roles: ['coach', 'admin'],
    keywords: ['wod', 'crear', 'amrap', 'for time', 'emom', 'tabata', 'chipper', 'metcon'],
    steps: [
      {
        title: 'Ve a WODs y presiona "Nuevo WOD"',
        body: 'Dale un nombre — puede ser un benchmark clásico como "Fran" o algo propio como "Viernes de infierno".',
      },
      {
        title: 'Elige el formato',
        body: 'AMRAP (tantas rondas como puedas en un tiempo), For Time (completar lo antes posible), EMOM (cada minuto en el minuto), Tabata (20s trabajo / 10s descanso), Chipper (lista larga sin repetir), Intervalos o personalizado.',
      },
      {
        title: 'Define tiempos y rondas',
        body: 'Según el formato, configura el time cap, la cantidad de rondas y los segundos de trabajo y descanso.',
      },
      {
        title: 'Agrega los movimientos',
        body: 'Cada movimiento lleva sus repeticiones, peso, distancia o calorías según corresponda. Puedes elegirlos de la biblioteca de ejercicios o escribirlos directamente.',
      },
      {
        title: 'Usa el cronómetro integrado',
        body: 'Desde el WOD puedes lanzar el timer configurado con ese formato: cuenta regresiva, intervalos y avisos sonoros ya vienen listos según el tipo que elegiste.',
      },
    ],
  },

  {
    id: 'usar-timer',
    title: 'Usar el cronómetro',
    summary: 'Timer independiente para AMRAP, EMOM, Tabata y For Time.',
    category: 'wods',
    roles: ['coach', 'athlete', 'admin'],
    keywords: ['timer', 'cronómetro', 'reloj', 'tiempo', 'tabata', 'intervalos'],
    steps: [
      {
        title: 'Abre Timer desde el menú',
        body: 'Es un cronómetro independiente que puedes usar sin necesidad de tener un WOD creado.',
      },
      {
        title: 'Elige el modo',
        body: 'Selecciona entre cuenta regresiva, cuenta ascendente, intervalos configurables o Tabata preconfigurado.',
      },
      {
        title: 'Configura y lanza',
        body: 'Define los minutos, segundos de trabajo y descanso, y las rondas. Presiona iniciar. La pantalla se mantiene visible y grande para verla desde lejos durante la clase.',
      },
    ],
    tips: [
      'Si estás proyectando el timer en una pantalla del box, activa el modo oscuro para mejor contraste.',
    ],
  },

  /* ─────────────── PROGRAMACIÓN ─────────────── */

  {
    id: 'programar-semana',
    title: 'Programar la semana del box',
    summary: 'Asigna qué WOD o rutina toca cada día y para qué grupo.',
    category: 'programacion',
    roles: ['coach', 'admin'],
    keywords: ['programación', 'semana', 'planificar', 'calendario', 'agenda', 'box'],
    steps: [
      {
        title: 'Abre Programación',
        body: 'Verás la semana actual en columnas, de lunes a domingo. Con las flechas navegas entre semanas.',
      },
      {
        title: 'Presiona el día que quieres programar',
        body: 'Se abre un panel donde eliges qué asignar a ese día.',
      },
      {
        title: 'Elige entre WOD o rutina',
        body: 'Puedes asignar un WOD suelto o una rutina completa con sus bloques. Selecciónalo de la lista de los que ya tienes creados.',
      },
      {
        title: 'Asigna a un grupo (opcional)',
        body: 'Si tienes grupos configurados —por ejemplo "Clase 7am" o "Competidores"— puedes dirigir esa programación solo a ese grupo. Si no eliges grupo, aplica a todos.',
      },
      {
        title: 'Agrega notas para el día',
        body: 'Útil para avisos como "traer chaleco" o "clase en el patio".',
      },
    ],
    tips: [
      'Lo que programas aquí es lo que tus atletas ven en su Calendario.',
      'Puedes programar varias semanas por adelantado y ajustar sobre la marcha.',
    ],
  },

  {
    id: 'ver-calendario',
    title: 'Consultar tu calendario',
    summary: 'Revisa qué te toca entrenar cada día.',
    category: 'programacion',
    roles: ['coach', 'athlete', 'admin'],
    keywords: ['calendario', 'agenda', 'día', 'sesiones', 'próximo'],
    steps: [
      {
        title: 'Abre Calendario',
        body: 'Muestra las sesiones programadas y lo que el box tiene planificado para cada día.',
      },
      {
        title: 'Haz clic en un día para ver el detalle',
        body: 'Verás el WOD o la rutina asignada, con sus bloques y movimientos completos.',
      },
      {
        title: 'Entra a la sesión para registrarla',
        body: 'Desde el día correspondiente puedes iniciar la sesión e ir registrando lo que realizas.',
      },
    ],
  },

  /* ─────────────── HERRAMIENTAS ─────────────── */

  {
    id: 'calculadora-prs',
    title: 'Registrar PRs y calcular porcentajes',
    summary: 'Guarda tus marcas personales y obtén la tabla de cargas de trabajo.',
    category: 'herramientas',
    roles: ['coach', 'athlete', 'admin'],
    keywords: ['pr', '1rm', 'calculadora', 'porcentaje', 'marca', 'record', 'carga', 'epley'],
    steps: [
      {
        title: 'Abre Calculadora (o "Mis PRs" si eres atleta)',
        body: 'Si eres coach, primero eliges de qué atleta quieres ver o registrar marcas. Si eres atleta, ves directamente las tuyas.',
      },
      {
        title: 'Calcula un 1RM estimado',
        body: 'Ingresa el peso levantado y las repeticiones que lograste. Thryra estima tu 1RM con la fórmula de Epley. Si hiciste una sola repetición, ese es tu 1RM real.',
      },
      {
        title: 'Guarda la marca',
        body: 'Elige el movimiento —Back Squat, Deadlift, Clean & Jerk, Snatch, Thruster y muchos más, o escribe uno personalizado— y guarda. Queda con fecha en tu historial.',
      },
      {
        title: 'Usa la tabla de porcentajes',
        body: 'Una vez guardado el PR, Thryra despliega la tabla de cargas del 50% al 105%, agrupada por zonas: calentamiento, técnica, fuerza e intensidad. Es la referencia directa para prescribir o ejecutar entrenamientos por porcentaje.',
      },
    ],
    tips: [
      'Mantén los PRs actualizados: los bloques de rutina que usan % de 1RM se vuelven mucho más útiles cuando la marca base es real y reciente.',
    ],
  },

  {
    id: 'biblioteca-ejercicios',
    title: 'Buscar ejercicios y crear los tuyos',
    summary: 'Usa la biblioteca incluida o agrega movimientos propios de tu box.',
    category: 'herramientas',
    roles: ['coach', 'admin'],
    keywords: ['ejercicios', 'biblioteca', 'movimientos', 'crear ejercicio', 'personalizado', 'buscar'],
    steps: [
      {
        title: 'Abre Ejercicios',
        body: 'Thryra incluye una biblioteca amplia con imágenes y descripciones, más los ejercicios propios de CrossFit, fuerza, Hyrox y calistenia.',
      },
      {
        title: 'Filtra para encontrar lo que buscas',
        body: 'Puedes buscar por nombre, filtrar por grupo muscular (cuádriceps, hombros, pecho, espalda, core, isquios, bíceps, tríceps, glúteos, full body) o por origen.',
      },
      {
        title: 'Crea un ejercicio personalizado',
        body: 'Si tu box usa un movimiento que no está en la biblioteca, créalo con nombre, grupo muscular, equipo e instrucciones. Queda disponible para tus rutinas.',
      },
    ],
    tips: [
      'Los ejercicios que creas son privados: los ves tú y tus atletas, no otros coaches del box.',
    ],
  },

  {
    id: 'reportes',
    title: 'Revisar reportes y adherencia',
    summary: 'Detecta quién está entrenando y quién se está desconectando.',
    category: 'herramientas',
    roles: ['coach', 'admin'],
    keywords: ['reportes', 'métricas', 'adherencia', 'estadísticas', 'seguimiento', 'inactivos'],
    steps: [
      {
        title: 'Abre Reportes',
        body: 'Muestra el panorama general de tu cartera: sesiones completadas, adherencia por atleta y actividad reciente.',
      },
      {
        title: 'Identifica atletas en riesgo',
        body: 'Presta atención a los días desde el último entrenamiento. Un atleta que lleva más de una semana sin registrar sesiones suele ser el que está por abandonar.',
      },
      {
        title: 'Contrasta lo prescrito con lo realizado',
        body: 'Comparar sesiones programadas contra completadas te dice si el volumen que estás asignando es realista para ese atleta.',
      },
    ],
  },

  /* ─────────────── EQUIPO ─────────────── */

  {
    id: 'invitar-usuarios',
    title: 'Invitar coaches y atletas',
    summary: 'Da acceso a la plataforma enviando una invitación por email.',
    category: 'equipo',
    roles: ['coach', 'admin'],
    keywords: ['invitar', 'invitación', 'acceso', 'email', 'coach', 'atleta', 'registro'],
    steps: [
      {
        title: 'Abre Invitaciones',
        body: 'Verás todas las invitaciones enviadas con su estado: pendiente, aceptada o expirada.',
      },
      {
        title: 'Presiona "Nueva invitación"',
        body: 'Escribe el email de la persona y elige el rol que tendrá: Atleta, Coach o Administrador.',
      },
      {
        title: 'Envía y espera la aceptación',
        body: 'La persona recibe un enlace para crear su cuenta. Mientras no lo acepte, la invitación aparece como pendiente.',
      },
      {
        title: 'Si expira, vuelve a enviarla',
        body: 'Las invitaciones tienen fecha de vencimiento. Si expiró, simplemente crea una nueva con el mismo email.',
      },
    ],
    tips: [
      'Un coach puede invitar atletas. Solo los administradores pueden invitar otros coaches o administradores.',
      'Invitar a un atleta que ya tiene ficha creada le conecta la cuenta con su historial existente.',
    ],
  },

  {
    id: 'roles-permisos',
    title: 'Entender los roles y qué puede hacer cada uno',
    summary: 'Atleta, Coach y Administrador: alcances y diferencias.',
    category: 'equipo',
    roles: ['coach', 'athlete', 'admin'],
    keywords: ['roles', 'permisos', 'admin', 'coach', 'atleta', 'accesos', 'quien puede'],
    steps: [
      {
        title: 'Atleta',
        body: 'Ve sus rutinas asignadas, su calendario, sus PRs y el timer. Registra sus propias sesiones. No ve las rutinas de otros atletas ni puede crear contenido para terceros.',
      },
      {
        title: 'Coach',
        body: 'Todo lo anterior más: crear y asignar rutinas y WODs, gestionar sus atletas, programar la semana, crear grupos, invitar atletas y ver reportes. Solo ve los atletas que le pertenecen.',
      },
      {
        title: 'Administrador',
        body: 'Todo lo del coach, con alcance sobre el box completo: ve a todos los atletas y coaches, gestiona el equipo, invita coaches y administradores, y configura los datos de la organización.',
      },
    ],
  },

  {
    id: 'crear-grupos',
    title: 'Organizar atletas en grupos',
    summary: 'Agrupa por clase, programa o equipo para programar más rápido.',
    category: 'equipo',
    roles: ['coach', 'admin'],
    keywords: ['grupos', 'clases', 'equipos', 'programa', 'organizar', 'horario'],
    steps: [
      {
        title: 'Abre Grupos y crea uno nuevo',
        body: 'Dale un nombre representativo: "Clase 7am", "Competidores", "Iniciación".',
      },
      {
        title: 'Define el tipo y el horario',
        body: 'Elige si es una clase, un programa o un equipo. Puedes fijar los días de la semana, hora de inicio y término, y el cupo máximo.',
      },
      {
        title: 'Agrega atletas al grupo',
        body: 'Selecciona quiénes lo integran. Un atleta puede pertenecer a más de un grupo.',
      },
      {
        title: 'Úsalo al programar',
        body: 'Al asignar un WOD o rutina en Programación puedes dirigirlo solo a ese grupo, en lugar de a todo el box.',
      },
    ],
  },
]

/* ─────────────── Helpers ─────────────── */

export function getArticlesForRole(role: HelpRole): HelpArticle[] {
  return HELP_ARTICLES.filter(a => a.roles.includes(role))
}

export function searchArticles(articles: HelpArticle[], query: string): HelpArticle[] {
  const q = query.trim().toLowerCase()
  if (!q) return articles
  return articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    a.keywords.some(k => k.includes(q)) ||
    a.steps.some(s => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
  )
}
