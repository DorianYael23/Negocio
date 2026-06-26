/**
 * hooks/useOfflineClientes.ts
 *
 * Hook que reemplaza las llamadas directas a Supabase en ClientList y ClientCard.
 * - Con señal: usa Supabase normalmente + actualiza IndexedDB.
 * - Sin señal: lee/escribe solo en IndexedDB y marca cambios como _pendiente.
 * - Al recuperar la señal: llama syncAll() automáticamente.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { db, type ClienteLocal, type MovimientoLocal } from "@/lib/db"
import { syncAll } from "@/lib/sync"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// Función auxiliar para IDs temporales amigables con bases de datos SQL.
// Genera un INT negativo pequeño, evitando el error de desbordamiento de Date.now()
const generarTempId = () => -(Math.floor(Math.random() * 999999) + 1);

// ─── Hook principal ────────────────────────────────────────────────────────

export function useOfflineClientes() {
  const [clientes, setClientes] = useState<ClienteLocal[]>([])
  const [cargando, setCargando] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
  }, [])

  // ── Detectar cambios de conectividad ──
  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true)
      toast.info("Conexión recuperada. Sincronizando...")
      await syncAll()
      await cargarClientes()
      toast.success("Datos sincronizados ✓")
    }
    const onOffline = () => {
      setIsOnline(false)
      toast.warning("Sin conexión. Modo offline activado.")
    }

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  // ── Carga inicial ──
  const cargarClientes = useCallback(async () => {
    setCargando(true)
    try {
      if (isOnline) {
        // Online: sincroniza y lee de IndexedDB (siempre fresco)
        await syncAll()
      }
      // Offline o post-sync: lee siempre de IndexedDB
      const local = await db.clientes.orderBy("nombre").toArray()
      setClientes(local)
    } catch (err) {
      console.error("[useOfflineClientes] Error al cargar:", err)
      toast.error("Error al cargar clientes")
    } finally {
      setCargando(false)
    }
  }, [isOnline])

  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  // ─── Operaciones ────────────────────────────────────────────────────────

  /** Agrega un cliente nuevo */
  const agregarCliente = async (nombre: string): Promise<boolean> => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from("clientes")
          .insert([{ nombre, saldo_pendiente: 0 }])
          .select()
          .single()
        if (error) throw error
        await db.clientes.put({ ...data, _pendiente: false })
      } else {
        // ID temporal SQL-safe
        const tempId = generarTempId()
        await db.clientes.put({
          id: tempId,
          nombre,
          saldo_pendiente: 0,
          _pendiente: true,
        })
      }
      await cargarClientes()
      return true
    } catch (err) {
      console.error("[agregarCliente]", err)
      toast.error("Error al guardar el cliente")
      return false
    }
  }

  /** Registra un abono */
  const registrarAbono = async (
    clienteId: number,
    monto: number,
    saldoActual: number
  ): Promise<boolean> => {
    const nuevoSaldo = saldoActual - monto
    try {
      if (isOnline) {
        const { error: errU } = await supabase
          .from("clientes")
          .update({ saldo_pendiente: nuevoSaldo })
          .eq("id", clienteId)
        if (errU) throw errU

        const { error: errM } = await supabase.from("movimientos").insert([{
          cliente_id: clienteId,
          tipo_movimiento: "abono",
          monto,
          descripcion: "Abono a cuenta",
        }])
        if (errM) throw errM

        // Refleja en local usando un ID temporal seguro
        await db.clientes.update(clienteId, { saldo_pendiente: nuevoSaldo, _pendiente: false })
        await db.movimientos.put({
          id: generarTempId(), // ID temporal corregido
          cliente_id: clienteId,
          tipo_movimiento: "abono",
          monto,
          descripcion: "Abono a cuenta",
          created_at: new Date().toISOString(),
          _pendiente: false,
        })
      } else {
        // Offline: guarda localmente con flag pendiente
        await db.clientes.update(clienteId, { saldo_pendiente: nuevoSaldo, _pendiente: true })
        await db.movimientos.put({
          id: generarTempId(), // ID temporal corregido
          cliente_id: clienteId,
          tipo_movimiento: "abono",
          monto,
          descripcion: "Abono a cuenta",
          created_at: new Date().toISOString(),
          _pendiente: true,
        })
      }
      await cargarClientes()
      return true
    } catch (err) {
      console.error("[registrarAbono]", err)
      return false
    }
  }

  /** Registra una venta con múltiples items */
  const registrarVenta = async (
    clienteId: number,
    saldoActual: number,
    items: Array<{ productoId: number | null; nombre: string; precio: number; cantidad: number }>
  ): Promise<boolean> => {
    const totalVenta = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
    const nuevoSaldo = saldoActual + totalVenta

    try {
      if (isOnline) {
        const { error: errU } = await supabase
          .from("clientes")
          .update({ saldo_pendiente: nuevoSaldo })
          .eq("id", clienteId)
        if (errU) throw errU

        const movs = items.map((item) => ({
          cliente_id: clienteId,
          tipo_movimiento: "nueva_compra",
          monto: item.precio * item.cantidad,
          descripcion: `Venta: ${item.cantidad}x ${item.nombre}`,
          producto_id: item.productoId,
          cantidad: item.cantidad,
        }))
        const { error: errM } = await supabase.from("movimientos").insert(movs)
        if (errM) throw errM

        await db.clientes.update(clienteId, { saldo_pendiente: nuevoSaldo, _pendiente: false })
        for (const item of items) {
          await db.movimientos.put({
            id: generarTempId(), // ID temporal corregido
            cliente_id: clienteId,
            tipo_movimiento: "nueva_compra",
            monto: item.precio * item.cantidad,
            descripcion: `Venta: ${item.cantidad}x ${item.nombre}`,
            producto_id: item.productoId,
            cantidad: item.cantidad,
            created_at: new Date().toISOString(),
            _pendiente: false,
          })
        }
      } else {
        await db.clientes.update(clienteId, { saldo_pendiente: nuevoSaldo, _pendiente: true })
        for (const item of items) {
          await db.movimientos.put({
            id: generarTempId(), // ID temporal corregido
            cliente_id: clienteId,
            tipo_movimiento: "nueva_compra",
            monto: item.precio * item.cantidad,
            descripcion: `Venta: ${item.cantidad}x ${item.nombre}`,
            producto_id: item.productoId,
            cantidad: item.cantidad,
            created_at: new Date().toISOString(),
            _pendiente: true,
          })
        }
      }
      await cargarClientes()
      return true
    } catch (err) {
      console.error("[registrarVenta]", err)
      return false
    }
  }

  /** Elimina un cliente y sus movimientos */
  const eliminarCliente = async (clienteId: number): Promise<boolean> => {
    try {
      if (isOnline) {
        await supabase.from("movimientos").delete().eq("cliente_id", clienteId)
        await supabase.from("clientes").delete().eq("id", clienteId)
      }
      // Siempre borra local (si offline, se re-sincronizará al volver)
      await db.movimientos.where("cliente_id").equals(clienteId).delete()
      await db.clientes.delete(clienteId)
      await cargarClientes()
      return true
    } catch (err) {
      console.error("[eliminarCliente]", err)
      return false
    }
  }

  /** Historial de movimientos de un cliente */
  const getMovimientos = async (clienteId: number): Promise<MovimientoLocal[]> => {
    return db.movimientos
      .where("cliente_id")
      .equals(clienteId)
      .reverse()
      .sortBy("created_at")
  }

  return {
    clientes,
    cargando,
    isOnline,
    recargar: cargarClientes,
    agregarCliente,
    registrarAbono,
    registrarVenta,
    eliminarCliente,
    getMovimientos,
  }
}