/**
 * lib/sync.ts
 * Sincronización entre IndexedDB (local) y Supabase (remoto).
 *
 * Flujo:
 *  1. pullFromSupabase() → descarga clientes y movimientos a IndexedDB.
 *  2. pushPendientes()   → sube cambios hechos offline.
 *  3. syncAll()          → hace ambas cosas en orden (pull → push).
 *
 * Llamar syncAll() al montar la app y cada vez que se recupere la conexión.
 */

import { supabase } from "@/lib/supabase"
import { db } from "@/lib/db"

// ─── Pull: Supabase → IndexedDB ────────────────────────────────────────────

export async function pullFromSupabase(): Promise<void> {
  // Clientes
  const { data: clientes, error: errC } = await supabase
    .from("clientes")
    .select("*")

  if (errC) {
    console.warn("[sync] Error descargando clientes:", errC.message)
  } else if (clientes) {
    // bulkPut: inserta o actualiza sin borrar los que tienen _pendiente=true
    await db.clientes.bulkPut(
      clientes.map((c) => ({ ...c, _pendiente: false }))
    )
  }

  // Movimientos
  const { data: movimientos, error: errM } = await supabase
    .from("movimientos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500) // últimos 500 movimientos; ajusta según tu negocio

  if (errM) {
    console.warn("[sync] Error descargando movimientos:", errM.message)
  } else if (movimientos) {
    await db.movimientos.bulkPut(
      movimientos.map((m) => ({ ...m, _pendiente: false }))
    )
  }
}

// ─── Push: IndexedDB (pendientes) → Supabase ───────────────────────────────

export async function pushPendientes(): Promise<void> {
  // ── Clientes nuevos/modificados offline ──
  const clientesPendientes = await db.clientes
  .filter((c) => c._pendiente === true)
  .toArray()

  for (const cliente of clientesPendientes) {
    const { _pendiente, ...data } = cliente

    if (cliente.id < 0) {
      // ID negativo = creado offline → INSERT
      const { data: inserted, error } = await supabase
        .from("clientes")
        .insert([{ nombre: data.nombre, saldo_pendiente: data.saldo_pendiente }])
        .select()
        .single()

      if (!error && inserted) {
        // Reemplaza el registro temporal con el ID real de Supabase
        await db.clientes.delete(cliente.id)
        await db.clientes.put({ ...inserted, _pendiente: false })
      } else {
        console.warn("[sync] Error insertando cliente:", error?.message)
      }
    } else {
      // ID positivo = actualización offline → UPDATE
      const { error } = await supabase
        .from("clientes")
        .update({ saldo_pendiente: data.saldo_pendiente, notas: data.notas })
        .eq("id", data.id)

      if (!error) {
        await db.clientes.update(cliente.id, { _pendiente: false })
      } else {
        console.warn("[sync] Error actualizando cliente:", error?.message)
      }
    }
  }

  // ── Movimientos pendientes offline ──
  const movsPendientes = await db.movimientos
  .filter((m) => m._pendiente === true)
  .toArray()

  for (const mov of movsPendientes) {
    const { _pendiente, id, ...data } = mov

    // Los movimientos siempre son INSERT (nunca se editan)
    const { data: inserted, error } = await supabase
      .from("movimientos")
      .insert([data])
      .select()
      .single()

    if (!error && inserted) {
      // Borra el temporal y guarda el real
      await db.movimientos.delete(id)
      await db.movimientos.put({ ...inserted, _pendiente: false })
    } else {
      console.warn("[sync] Error insertando movimiento:", error?.message)
    }
  }
}

// ─── Sync completo ─────────────────────────────────────────────────────────

export async function syncAll(): Promise<void> {
  try {
    await pushPendientes() // primero sube lo offline…
    await pullFromSupabase() // …luego baja el estado actualizado
    console.info("[sync] Sincronización completada ✓")
  } catch (err) {
    console.warn("[sync] Error en syncAll:", err)
  }
}