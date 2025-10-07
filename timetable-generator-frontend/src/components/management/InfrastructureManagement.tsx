import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'
import { ClassroomsAPI, TimeSlotsAPI } from '../../api/endpoints'
import type { ClassroomCreate, ClassroomOut, TimeSlotCreate, TimeSlotOut } from '../../types/backend'

export default function InfrastructureManagement() {
  const [rooms, setRooms] = useState<ClassroomOut[]>([])
  const [timeslots, setTimeslots] = useState<TimeSlotOut[]>([])
  const [loading, setLoading] = useState(false)
  const [formRoom, setFormRoom] = useState<ClassroomCreate>({ room_number: '', capacity: 0, building: '', resources: '' })
  const [formTS, setFormTS] = useState<TimeSlotCreate>({ day: '', start_time: '', end_time: '' })
  const roomHeaders = useMemo(() => ['id','room_number','capacity','building','resources'], [])
  const tsHeaders = useMemo(() => ['id','day','start_time','end_time'], [])

  async function refresh() {
    setLoading(true)
    try {
      const [r, t] = await Promise.all([ClassroomsAPI.list(), TimeSlotsAPI.list()])
      setRooms(r)
      setTimeslots(t)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function addRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!formRoom.room_number) return
    const created = await ClassroomsAPI.create({ ...formRoom, capacity: Number(formRoom.capacity) })
    setRooms((prev) => [...prev, created])
    setFormRoom({ room_number: '', capacity: 0, building: '', resources: '' })
  }

  async function addTimeslot(e: React.FormEvent) {
    e.preventDefault()
    if (!formTS.day || !formTS.start_time || !formTS.end_time) return
    const created = await TimeSlotsAPI.create(formTS)
    setTimeslots((prev) => [...prev, created])
    setFormTS({ day: '', start_time: '', end_time: '' })
  }

  async function removeRoom(id: number) {
    await ClassroomsAPI.delete(id)
    setRooms((prev) => prev.filter((r) => r.id !== id))
  }

  async function removeTimeslot(id: number) {
    await TimeSlotsAPI.delete(id)
    setTimeslots((prev) => prev.filter((t) => t.id !== id))
  }

  function onBulkRooms(rows: any[]) {
    const mapped: ClassroomCreate[] = rows.map((r) => ({
      room_number: String(r.room_number || r.room || ''),
      capacity: Number(r.capacity || 0),
      building: String(r.building || ''),
      resources: String(r.resources || ''),
    })).filter((s) => s.room_number)
    ;(async () => {
      for (const m of mapped) {
        const created = await ClassroomsAPI.create(m)
        setRooms((prev) => [...prev, created])
      }
    })()
  }

  function onBulkTimeslots(rows: any[]) {
    const mapped: TimeSlotCreate[] = rows.map((r) => ({
      day: String(r.day || ''),
      start_time: String(r.start_time || ''),
      end_time: String(r.end_time || ''),
    })).filter((s) => s.day && s.start_time && s.end_time)
    ;(async () => {
      for (const m of mapped) {
        const created = await TimeSlotsAPI.create(m)
        setTimeslots((prev) => [...prev, created])
      }
    })()
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Classroom</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <form onSubmit={addRoom} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Room number" value={formRoom.room_number} onChange={(e) => setFormRoom({ ...formRoom, room_number: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Capacity" type="number" value={formRoom.capacity} onChange={(e) => setFormRoom({ ...formRoom, capacity: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Building" value={formRoom.building} onChange={(e) => setFormRoom({ ...formRoom, building: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Resources (optional)" value={formRoom.resources || ''} onChange={(e) => setFormRoom({ ...formRoom, resources: e.target.value })} />
          <div className="md:col-span-3 flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulkRooms} templateHeaders={roomHeaders} />

      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Classrooms</h3>
          <button onClick={refresh} className="text-sm text-blue-600">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                {roomHeaders.map((h) => (
                  <th key={h} className="text-left p-2 border-b capitalize">{h}</th>
                ))}
                <th className="p-2 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.room_number}</td>
                  <td className="p-2">{r.capacity}</td>
                  <td className="p-2">{r.building}</td>
                  <td className="p-2">{r.resources}</td>
                  <td className="p-2 text-right"><button onClick={() => removeRoom(r.id)} className="text-red-600">Delete</button></td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={roomHeaders.length + 1}>No records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Time Slot</h3>
        <form onSubmit={addTimeslot} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Day (e.g., Monday)" value={formTS.day} onChange={(e) => setFormTS({ ...formTS, day: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Start time (HH:MM)" value={formTS.start_time} onChange={(e) => setFormTS({ ...formTS, start_time: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="End time (HH:MM)" value={formTS.end_time} onChange={(e) => setFormTS({ ...formTS, end_time: e.target.value })} />
          <div className="md:col-span-3 flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulkTimeslots} templateHeaders={tsHeaders} />

      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Slots</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                {tsHeaders.map((h) => (
                  <th key={h} className="text-left p-2 border-b capitalize">{h}</th>
                ))}
                <th className="p-2 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {timeslots.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="p-2">{t.id}</td>
                  <td className="p-2">{t.day}</td>
                  <td className="p-2">{t.start_time}</td>
                  <td className="p-2">{t.end_time}</td>
                  <td className="p-2 text-right"><button onClick={() => removeTimeslot(t.id)} className="text-red-600">Delete</button></td>
                </tr>
              ))}
              {timeslots.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={tsHeaders.length + 1}>No records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


