/**
 * Qué discos poner en la barra para llegar a un peso.
 *
 * El box tiene discos en kilos y en libras, y se mezclan en la misma barra.
 * Eso es lo que hace que la cuenta no sea trivial: 45 lb no son 20 kg sino
 * 20.41, así que apenas entra una libra al cálculo el total deja de ser
 * redondo. Por eso la búsqueda prefiere, en este orden:
 *
 *   1. una combinación exacta usando SOLO kilos    (lo más limpio)
 *   2. una combinación exacta usando SOLO libras
 *   3. la más cercana mezclando los dos
 *
 * Mezclar es el último recurso y no el primero: si se puede armar el peso con
 * puros discos de kilos, mezclar libras solo agrega desorden en el suelo.
 *
 * Todo el cálculo interno va en gramos enteros. Con decimales, 45 lb + 35 lb
 * acumula error de coma flotante y "80 kg exactos" termina siendo 79.99999.
 */

export type Unidad = 'kg' | 'lb'

export const LB_A_KG = 0.45359237

/** Inventario del box. Si cambian los discos, se cambia acá. */
export const DISCOS_KG = [25, 20, 15, 10, 5, 2.5, 1.25]
export const DISCOS_LB = [45, 35, 25, 15, 10, 5, 2.5]

export const BARRAS = [
  { kg: 20, etiqueta: '20 kg' },
  { kg: 15, etiqueta: '15 kg' },
]

/** Cuánto se puede errar y seguir llamándolo "exacto": 10 gramos. */
const TOLERANCIA_G = 10

/** Tope de discos por lado. Más que esto no cabe en la barra. */
const MAX_DISCOS_POR_LADO = 8

export interface Disco {
  unidad: Unidad
  /** El número que está pintado en el disco: 20 si es de 20 kg, 45 si es de 45 lb. */
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
 * Gana el menor error; a igual error, el que use menos discos. Cargar
 * 1×25 es mejor que 2×10 + 1×5 aunque den lo mismo.
 */
function buscar(objetivoG: number, inventario: Disco[], maxDiscos: number): Resultado | null {
  const orden = [...inventario].sort((a, b) => b.gramos - a.gramos)
  let mejor: Resultado | null = null

  const cuenta = new Array(orden.length).fill(0)

  const considerar = (acumuladoG: number, usados: number) => {
    const errorG = Math.abs(acumuladoG - objetivoG)
    if (mejor === null || errorG < mejor.errorG || (errorG === mejor.errorG && usados < mejor.discos)) {
      mejor = { cuenta: [...cuenta], errorG, discos: usados }
    }
  }

  const paso = (i: number, acumuladoG: number, usados: number) => {
    considerar(acumuladoG, usados)
    // Ya está exacto: agregar discos solo puede empeorarlo.
    if (mejor && mejor.errorG <= TOLERANCIA_G && mejor.discos <= usados) return
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
 * Qué cargar por lado para llegar a `objetivoKg` con una barra de `barraKg`.
 *
 * Devuelve null si el objetivo no llega ni al peso de la barra vacía: ahí no
 * hay nada que calcular y avisar "no se puede" es más honesto que sugerir
 * discos imposibles.
 */
export function calcularCarga(objetivoKg: number, barraKg: number): Carga | null {
  if (!Number.isFinite(objetivoKg) || !Number.isFinite(barraKg)) return null
  if (objetivoKg < barraKg) return null

  const objetivoG = Math.round((aGramos(objetivoKg) - aGramos(barraKg)) / 2)
  if (objetivoG === 0) {
    return { porLado: [], kgPorLado: 0, totalKg: barraKg, exacta: true, diferenciaKg: 0, mezclada: false }
  }

  // 1 y 2: exacto con un solo sistema.
  for (const inventario of [SOLO_KG, SOLO_LB]) {
    const r = buscar(objetivoG, inventario, MAX_DISCOS_POR_LADO)
    if (r && r.errorG <= TOLERANCIA_G) {
      return armar(r, inventario, objetivoG, barraKg, objetivoKg)
    }
  }

  // 3: lo más cerca posible, mezclando.
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

export function calcularFaltante(objetivoKg: number, barraKg: number, cargadoKgPorLado: number): Faltante | null {
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
  const agregar = calcularCarga(objetivoKg, actualKg)
  return { ...base, agregar }
}

/** 80 → "176.4 lb" */
export function kgALb(kg: number): number {
  return Math.round((kg / LB_A_KG) * 10) / 10
}

export function lbAKg(lb: number): number {
  return Math.round(lb * LB_A_KG * 100) / 100
}
