import { useEffect, useMemo, useState } from 'react'
import { ClassroomsAPI } from '../../api/endpoints'
import type { ClassroomCreate, ClassroomOut } from '../../types/backend'

export default function ClassroomManagement() {
  const [items, setItems] = useState<ClassroomOut[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<ClassroomCreate>({ room_number: '', capacity: 0, building: '', resources: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const headers = useMemo(() => ['id','room_number','capacity','building','resources'], [])
  const [message, setMessage] = useState<string | null>(null)
  const [searchId, setSearchId] = useState<string>('')
  const [searching, setSearching] = useState(false)

  function showMessage(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }

  async function refresh() {
    setLoading(true)
    try {
      const data = await ClassroomsAPI.list()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.room_number) return
    if (editingId) {
      const updated = await ClassroomsAPI.update(editingId, { ...form, capacity: Number(form.capacity) })
      setItems((prev) => prev.map((r) => r.id === editingId ? updated : r))
      setEditingId(null)
      setForm({ room_number: '', capacity: 0, building: '', resources: '' })
      showMessage('✏️ Classroom updated')
      return
    }
    const created = await ClassroomsAPI.create({ ...form, capacity: Number(form.capacity) })
    setItems((prev) => [...prev, created])
    setForm({ room_number: '', capacity: 0, building: '', resources: '' })
    showMessage('✅ Classroom created')
  }

  async function remove(id: number) {
    await ClassroomsAPI.delete(id)
    setItems((prev) => prev.filter((r) => r.id !== id))
    showMessage('🗑️ Classroom deleted')
  }

  async function startEdit(id: number) {
    const r = await ClassroomsAPI.get(id)
    setEditingId(r.id)
    setForm({ room_number: r.room_number, capacity: r.capacity, building: r.building, resources: r.resources || '' })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 rounded-lg border bg-green-50 text-green-800 text-sm">{message}</div>
      )}
      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Classroom</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Room number" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Resources (optional)" value={form.resources || ''} onChange={(e) => setForm({ ...form, resources: e.target.value })} />
          <div className="md:col-span-4 flex justify-end gap-2">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ room_number: '', capacity: 0, building: '', resources: '' }) }} className="px-4 py-2 rounded-lg border">Cancel</button>
            )}
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">{editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>

      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Classrooms</h3>
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Search by ID" className="border rounded-lg px-3 py-1.5 text-sm" />
            <button disabled={searching || !searchId} onClick={async () => {
              if (!searchId) return
              setSearching(true)
              try {
                const r = await ClassroomsAPI.get(Number(searchId))
                setItems([r])
              } catch {
                showMessage('No classroom found')
              } finally {
                setSearching(false)
              }
            }} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50">{searching ? 'Searching…' : 'Search'}</button>
            <button onClick={refresh} className="text-sm text-blue-600">Refresh</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((h) => (
                  <th key={h} className="text-left p-2 border-b capitalize">{h}</th>
                ))}
                <th className="p-2 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.room_number}</td>
                  <td className="p-2">{r.capacity}</td>
                  <td className="p-2">{r.building}</td>
                  <td className="p-2">{r.resources}</td>
                  <td className="p-2 text-right space-x-2">
                    <button onClick={() => startEdit(r.id)} className="text-blue-600">Edit</button>
                    <button onClick={() => remove(r.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={headers.length + 1}>No records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


