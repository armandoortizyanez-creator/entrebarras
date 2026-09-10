/**
 * Qué discos poner en la barra para llegar a un peso.
 *
 * El box tiene discos en kilos y en libras. Qué se usa depende de qué esté
 * libre ese día, y eso lo sabe el atleta, no la app. Por eso el modo lo elige
 * él:
 *
 *   kg       solo discos en kilos
 *   lb       solo discos en libras
 *   mezcla   los dos. Aun así prefiere, en este orden: exacto con puros
 *            kilos, exacto con puras libras, y recién ahí combina. Si el peso
 *            sale con un solo sistema, mezclar solo agrega desorden en el
 *            suelo.
 *
 * Las libras son las que hacen que la cuenta no sea trivial: 35 lb no son
 * 15 kg sino 15.88, así que apenas entra una libra el total deja de ser
 * redondo.
 *
 * Todo el cálculo interno va en gramos enteros. Con decimales, 35 lb + 25 lb
 * acumula error de coma flotante y "80 kg exactos" termina siendo 79.99999.
 */

export type Unidad = 'kg' | 'lb'

export const LB_A_KG = 0.45359237

/** Inventario del box, confirmado por el coach. Si cambian los discos, se cambia acá. */
export const DISCOS_KG = [25, 20, 15, 10, 5, 2.5, 1]
export const DISCOS_LB = [35, 25, 20, 15, 10]

export type ModoDiscos = 'kg' | 'lb' | 'mezcla'

export const MODOS_DE_DISCOS: { valor: ModoDiscos; etiqueta: string }[] = [
  { valor: 'kg', etiqueta: 'Kg' },
  { valor: 'lb', etiqueta: 'Lb' },
  { valor: 'mezcla', etiqueta: 'Mezclar' },
]

export const BARRAS = [
  { kg: 20, etiqueta: '20 kg' },
  { kg: 15, etiqueta: '15 kg' },
]

/** Cuánto se puede errar y seguir llamándolo "exacto": 10 gramos. */
const TOLERANCIA_G = 10

/**
 * Lo que "cuesta" poner un disco más por lado, en gramos de error. 100 g por
 * lado son 0.2 kg en la barra: un disco extra solo entra si acerca más que eso.
 *
 * Calibrado contra el inventario real. Con discos de 1 y 2.5 kg, la
 * alternativa inexacta más cercana en kilos siempre queda a 0.5 kg por lado,
 * así que un peso pedido que se puede armar exacto sale exacto (41 kg es
 * 5 + 2.5 + 1 + 1 + 1 y no "40, uno de menos"). Donde sí actúa es con los
 * porcentajes, que dan números como 72.6: ahí prefiere 25 + 1 (72 kg) antes
 * que seis discos para 73. Con 150 g se perdía la exactitud en enteros; si
 * prefieren cargas más simples todavía, se sube.
 */
const COSTO_POR_DISCO_G = 100

/** Tope de discos por lado. Más que esto no cabe en la barra. */
const MAX_DISCOS_POR_LADO = 8

export interface Disco {
  unidad: Unidad
  /** El número que está pintado en el disco: 20 si es de 20 kg, 35 si es de 35 lb. */
  valor: number
  gramos: number
}

export interface DiscoContado {
  disco: Disco
  cantidad: number
}

export interface Carga {
  /** Lo que va en UN lado de la barra. */
  porLado: DiscoContado[]
  kgPorLado: number
  /** Barra + los dos lados. */
  totalKg: number
  /** true si da el objetivo justo. */
  exacta: boolean
  /** totalKg − objetivo. Negativo = quedó corto. */
  diferenciaKg: number
  /** true si hubo que combinar kilos con libras. */
  mezclada: boolean
}

const aGramos = (kg: number) => Math.round(kg * 1000)
const aKg = (g: number) => Math.round(g / 10) / 100

const DISCOS: Disco[] = [
  ...DISCOS_KG.map(v => ({ unidad: 'kg' as const, valor: v, gramos: aGramos(v) })),
  ...DISCOS_LB.map(v => ({ unidad: 'lb' as const, valor: v, gramos: Math.round(v * LB_A_KG * 1000) })),
]

const SOLO_KG = DISCOS.filter(d => d.unidad === 'kg')
const SOLO_LB = DISCOS.filter(d => d.unidad === 'lb')

interface Resultado {
  cuenta: number[]
  errorG: number
  discos: number
}

/**
 * Búsqueda en profundidad sobre el inventario ordenado de mayor a menor.
 *
 * Se permite repetir un disco (hay pares de sobra) pero no volver a uno ya
 * pasado: eso evita contar la misma combinación en distinto orden, que era lo
 * que hacía explotar la búsqueda.
 *
 * Gana el menor puntaje = error + un costo por cada disco. El costo existe
 * porque sin él la búsqueda sugería cosas absurdas para la sala: siete discos
 * por lado, mezclando kilos y libras, para quedar a 0.01 kg en vez de a 0.5.
 * Con el costo, un disco extra solo entra si acerca más de lo que cuesta.
 * A igual puntaje, el que use menos discos.
 */
function buscar(objetivoG: number, inventario: Disco[], maxDiscos: number): Resultado | null {
  const orden = [...inventario].sort((a, b) => b.gramos - a.gramos)
  let mejor: (Resultado & { puntaje: number }) | null = null

  const cuenta = new Array(orden.length).fill(0)

  const considerar = (acumuladoG: number, usados: number) => {
    const errorG = Math.abs(acumuladoG - objetivoG)
    // Exacto (dentro de la tolerancia) cuenta como error cero: no se castiga
    // una combinación exacta por los gramos de redondeo de las libras.
    const puntaje = (errorG <= TOLERANCIA_G ? 0 : errorG) + usados * COSTO_POR_DISCO_G
    if (mejor === null || puntaje < mejor.puntaje || (puntaje === mejor.puntaje && usados < mejor.discos)) {
      mejor = { cuenta: [...cuenta], errorG, discos: usados, puntaje }
    }
  }

  const paso = (i: number, acumuladoG: number, usados: number) => {
    considerar(acumuladoG, usados)
    // Cota: el error nunca baja de cero, así que cualquier combinación que
    // siga desde acá cuesta al menos lo que ya cuestan sus discos.
    if (mejor && (usados + 1) * COSTO_POR_DISCO_G >= mejor.puntaje) return
    if (usados >= maxDiscos || i >= orden.length) return

    for (let j = i; j < orden.length; j++) {
      const siguiente = acumuladoG + orden[j].gramos
      // Pasarse por más de lo que mide el disco más chico no lleva a nada mejor.
      if (siguiente - objetivoG > orden[orden.length - 1].gramos) continue
      cuenta[j]++
      paso(j, siguiente, usados + 1)
      cuenta[j]--
    }
  }

  paso(0, 0, 0)
  return mejor
}

function armar(res: Resultado, inventario: Disco[], objetivoG: number, barraKg: number, objetivoKg: number): Carga {
  const orden = [...inventario].sort((a, b) => b.gramos - a.gramos)
  const porLado: DiscoContado[] = []
  let gramosPorLado = 0

  res.cuenta.forEach((cantidad, i) => {
    if (cantidad > 0) {
      porLado.push({ disco: orden[i], cantidad })
      gramosPorLado += orden[i].gramos * cantidad
    }
  })

  const totalKg = aKg(aGramos(barraKg) + gramosPorLado * 2)
  const unidades = new Set(porLado.map(d => d.disco.unidad))

  return {
    porLado,
    kgPorLado: aKg(gramosPorLado),
    totalKg,
    exacta: Math.abs(gramosPorLado - objetivoG) <= TOLERANCIA_G,
    diferenciaKg: aKg(aGramos(totalKg) - aGramos(objetivoKg)),
    mezclada: unidades.size > 1,
  }
}

/**
 * Qué cargar por lado para llegar a `objetivoKg` con una barra de `barraKg`,
 * usando los discos que permite `modo`.
 *
 * Si no sale exacto devuelve la mejor carga razonable —no necesariamente la
 * más cercana: ver COSTO_POR_DISCO_G— y la diferencia, para que el atleta
 * decida si le sirve o si cambia de modo.
 *
 * Devuelve null si el objetivo no llega ni al peso de la barra vacía: ahí no
 * hay nada que calcular y avisar "no se puede" es más honesto que sugerir
 * discos imposibles.
 */
export function calcularCarga(objetivoKg: number, barraKg: number, modo: ModoDiscos = 'kg'): Carga | null {
  if (!Number.isFinite(objetivoKg) || !Number.isFinite(barraKg)) return null
  if (objetivoKg < barraKg) return null

  const objetivoG = Math.round((aGramos(objetivoKg) - aGramos(barraKg)) / 2)
  if (objetivoG === 0) {
    return { porLado: [], kgPorLado: 0, totalKg: barraKg, exacta: true, diferenciaKg: 0, mezclada: false }
  }

  if (modo === 'kg' || modo === 'lb') {
    const inventario = modo === 'kg' ? SOLO_KG : SOLO_LB
    const r = buscar(objetivoG, inventario, MAX_DISCOS_POR_LADO)
    if (!r) return null
    return armar(r, inventario, objetivoG, barraKg, objetivoKg)
  }

  // Mezcla: primero exacto con un solo sistema...
  for (const inventario of [SOLO_KG, SOLO_LB]) {
    const r = buscar(objetivoG, inventario, MAX_DISCOS_POR_LADO)
    if (r && r.errorG <= TOLERANCIA_G) {
      return armar(r, inventario, objetivoG, barraKg, objetivoKg)
    }
  }

  // ...y si no, la mejor carga combinando los dos.
  const r = buscar(objetivoG, DISCOS, MAX_DISCOS_POR_LADO)
  if (!r) return null
  return armar(r, DISCOS, objetivoG, barraKg, objetivoKg)
}

/** Lo que falta desde lo que ya está puesto, para llegar al objetivo. */
export interface Faltante {
  faltaKgPorLado: number
  faltaKgTotal: number
  faltaLbTotal: number
  /** Qué agregar a cada lado. null si ya está o si se pasó. */
  agregar: Carga | null
  yaEsta: boolean
  sePaso: boolean
}

export function calcularFaltante(
  objetivoKg: number, barraKg: number, cargadoKgPorLado: number, modo: ModoDiscos = 'kg',
): Faltante | null {
  if (!Number.isFinite(objetivoKg) || !Number.isFinite(cargadoKgPorLado)) return null

  const actualKg = aKg(aGramos(barraKg) + aGramos(cargadoKgPorLado) * 2)
  const faltaTotalG = aGramos(objetivoKg) - aGramos(actualKg)
  const faltaKgTotal = aKg(faltaTotalG)

  const base = {
    faltaKgPorLado: aKg(faltaTotalG / 2),
    faltaKgTotal,
    faltaLbTotal: Math.round((faltaKgTotal / LB_A_KG) * 10) / 10,
    yaEsta: Math.abs(faltaTotalG) <= TOLERANCIA_G,
    sePaso: faltaTotalG < -TOLERANCIA_G,
  }

  if (base.yaEsta || base.sePaso) return { ...base, agregar: null }

  // Qué discos agregar: el mismo cálculo, pero contra una "barra" que ya
  // incluye lo cargado.
  const agregar = calcularCarga(objetivoKg, actualKg, modo)
  return { ...base, agregar }
}

/** 80 → "176.4 lb" */
export function kgALb(kg: number): number {
  return Math.round((kg / LB_A_KG) * 10) / 10
}

export function lbAKg(lb: number): number {
  return Math.round(lb * LB_A_KG * 100) / 100
}
