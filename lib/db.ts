/**
 * lib/db.ts
 * Base de datos local usando IndexedDB (vía Dexie).
 * Guarda clientes y movimientos para acceso offline.
 */

import Dexie, { type Table } from "dexie"

// ─── Tipos (espejo de Supabase) ────────────────────────────────────────────

export interface ClienteLocal {
  id: number
  nombre: string
  saldo_pendiente: number
  notas?: string
  created_at?: string
  /** true = creado offline, pendiente de subir */
  _pendiente?: boolean
}

export interface MovimientoLocal {
  id: number
  cliente_id: number
  tipo_movimiento: string   // "nueva_compra" | "abono"
  monto: number
  descripcion?: string
  producto_id?: number | null
  cantidad?: number | null
  created_at?: string
  /** true = registrado offline, pendiente de subir */
  _pendiente?: boolean
}

// ─── Definición de la base de datos ────────────────────────────────────────

class NegocioDB extends Dexie {
  clientes!: Table<ClienteLocal, number>
  movimientos!: Table<MovimientoLocal, number>

  constructor() {
    super("negocio_offline_v1")

    this.version(1).stores({
      // Solo los campos que necesitas indexar van aquí
      clientes:     "id, nombre, saldo_pendiente, _pendiente",
      movimientos:  "id, cliente_id, tipo_movimiento, created_at, _pendiente",
    })
  }
}

export const db = new NegocioDB()