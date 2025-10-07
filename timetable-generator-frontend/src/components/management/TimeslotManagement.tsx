import { useEffect, useMemo, useState } from 'react'
import { TimeSlotsAPI } from '../../api/endpoints'
import type { TimeSlotCreate, TimeSlotOut } from '../../types/backend'

export default function TimeslotManagement() {
  const [items, setItems] = useState<TimeSlotOut[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<TimeSlotCreate>({ day: '', start_time: '', end_time: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const headers = useMemo(() => ['id','day','start_time','end_time'], [])
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'warning'>('success')
  const [searchId, setSearchId] = useState<string>('')
  const [searching, setSearching] = useState(false)

  function showMessage(msg: string, type: 'success' | 'warning' = 'success') {
    setMessageType(type)
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }

  async function refresh() {
    setLoading(true)
    try {
      const data = await TimeSlotsAPI.list()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.day || !form.start_time || !form.end_time) return
    // Load full list to ensure duplicate check is accurate even after a search filter
    const all = await TimeSlotsAPI.list()
    const normalizedDay = form.day.trim().toLowerCase()
    const normalizedStart = form.start_time.trim().toLowerCase()
    const normalizedEnd = form.end_time.trim().toLowerCase()
    const duplicate = all.find((t) =>
      t.day.trim().toLowerCase() === normalizedDay &&
      t.start_time.trim().toLowerCase() === normalizedStart &&
      t.end_time.trim().toLowerCase() === normalizedEnd &&
      (editingId ? t.id !== editingId : true)
    )
    if (duplicate) {
      showMessage('⚠️ Timeslot already exists', 'warning')
      return
    }
    if (editingId) {
      const updated = await TimeSlotsAPI.update(editingId, form)
      setItems((prev) => prev.map((t) => t.id === editingId ? updated : t))
      setEditingId(null)
      setForm({ day: '', start_time: '', end_time: '' })
      showMessage('✏️ Timeslot updated')
      return
    }
    const created = await TimeSlotsAPI.create(form)
    setItems((prev) => [...prev, created])
    setForm({ day: '', start_time: '', end_time: '' })
    showMessage('✅ Timeslot created')
  }

  async function remove(id: number) {
    await TimeSlotsAPI.delete(id)
    setItems((prev) => prev.filter((t) => t.id !== id))
    showMessage('🗑️ Timeslot deleted')
  }

  async function startEdit(id: number) {
    const t = await TimeSlotsAPI.get(id)
    setEditingId(t.id)
    setForm({ day: t.day, start_time: t.start_time, end_time: t.end_time })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg border text-sm ${messageType === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>{message}</div>
      )}

      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Timeslot</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="border rounded-lg px-3 py-2" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
            <option value="">Select day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
          <input className="border rounded-lg px-3 py-2" placeholder="Start time (HH:MM)" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="End time (HH:MM)" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          <div className="md:col-span-1 flex justify-end gap-2">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ day: '', start_time: '', end_time: '' }) }} className="px-4 py-2 rounded-lg border">Cancel</button>
            )}
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">{editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>

      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Timeslots</h3>
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Search by ID" className="border rounded-lg px-3 py-1.5 text-sm" />
            <button disabled={searching || !searchId} onClick={async () => {
              if (!searchId) return
              setSearching(true)
              try {
                const t = await TimeSlotsAPI.get(Number(searchId))
                setItems([t])
              } catch {
                showMessage('No timeslot found')
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
              {items.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="p-2">{t.id}</td>
                  <td className="p-2">{t.day}</td>
                  <td className="p-2">{t.start_time}</td>
                  <td className="p-2">{t.end_time}</td>
                  <td className="p-2 text-right space-x-2">
                    <button onClick={() => startEdit(t.id)} className="text-blue-600">Edit</button>
                    <button onClick={() => remove(t.id)} className="text-red-600">Delete</button>
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


