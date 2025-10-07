import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'
import { CoursesAPI, FacultyAPI, TimeSlotsAPI, ClassroomsAPI } from '../../api/endpoints'
import type { CourseCreate, CourseOut, FacultyOut, TimeSlotOut, ClassroomOut } from '../../types/backend'

export default function CourseManagement() {
  const [items, setItems] = useState<CourseOut[]>([])
  const [loading, setLoading] = useState(false)
  const [fac, setFac] = useState<FacultyOut[]>([])
  const [ts, setTs] = useState<TimeSlotOut[]>([])
  const [rooms, setRooms] = useState<ClassroomOut[]>([])
  const [form, setForm] = useState<CourseCreate>({ code: '', name: '', credits: 0, semester: 1, mandatory: false, faculty_id: 0, timeslot_id: 0, classroom_id: 0, max_seats: 0 })
  const headers = useMemo(() => ['id','code','name','credits','semester','mandatory','faculty_id','timeslot_id','classroom_id','max_seats'], [])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchId, setSearchId] = useState<string>('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [courses, faculty, timeslots, classrooms] = await Promise.all([
        CoursesAPI.list(),
        FacultyAPI.list(),
        TimeSlotsAPI.list(),
        ClassroomsAPI.list(),
      ])
      setItems(courses)
      setFac(faculty)
      setTs(timeslots)
      setRooms(classrooms)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name) return
    if (editingId) {
      const updated = await CoursesAPI.update(editingId, {
        ...form,
        credits: Number(form.credits),
        semester: Number(form.semester),
        faculty_id: Number(form.faculty_id),
        timeslot_id: Number(form.timeslot_id),
        classroom_id: Number(form.classroom_id),
        max_seats: Number(form.max_seats),
      })
      setItems((prev) => prev.map((c) => (c.id === editingId ? updated : c)))
      setEditingId(null)
      setForm({ code: '', name: '', credits: 0, semester: 1, mandatory: false, faculty_id: 0, timeslot_id: 0, classroom_id: 0, max_seats: 0 })
      setMessage('✏️ Course updated')
      setTimeout(() => setMessage(null), 3000)
      return
    }
    const created = await CoursesAPI.create({
      ...form,
      credits: Number(form.credits),
      semester: Number(form.semester),
      faculty_id: Number(form.faculty_id),
      timeslot_id: Number(form.timeslot_id),
      classroom_id: Number(form.classroom_id),
      max_seats: Number(form.max_seats),
    })
    setItems((prev) => [...prev, created])
    setForm({ code: '', name: '', credits: 0, semester: 1, mandatory: false, faculty_id: 0, timeslot_id: 0, classroom_id: 0, max_seats: 0 })
    setMessage('✅ Course created')
    setTimeout(() => setMessage(null), 3000)
  }

  async function remove(id: number) {
    await CoursesAPI.delete(id)
    setItems((prev) => prev.filter((c) => c.id !== id))
  }

  function onBulk(rows: any[]) {
    const mapped: CourseCreate[] = rows.map((r) => ({
      code: String(r.code || r.courseCode || ''),
      name: String(r.name || ''),
      credits: Number(r.credits || 0),
      semester: Number(r.semester || 1),
      mandatory: String(r.mandatory || 'false').toLowerCase() === 'true',
      faculty_id: Number(r.faculty_id || 0),
      timeslot_id: Number(r.timeslot_id || 0),
      classroom_id: Number(r.classroom_id || 0),
      max_seats: Number(r.max_seats || 0),
    })).filter((c) => c.code && c.name)
    ;(async () => {
      for (const m of mapped) {
        const created = await CoursesAPI.create(m)
        setItems((prev) => [...prev, created])
      }
    })()
  }

  async function startEdit(id: number) {
    const c = await CoursesAPI.get(id)
    setEditingId(c.id)
    setForm({
      code: c.code,
      name: c.name,
      credits: c.credits,
      semester: c.semester,
      mandatory: c.mandatory,
      faculty_id: c.faculty_id,
      timeslot_id: c.timeslot_id,
      classroom_id: c.classroom_id,
      max_seats: c.max_seats,
    })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 rounded-lg border bg-green-50 text-green-800 text-sm">{message}</div>
      )}
      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Course</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Semester" type="number" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          <select className="border rounded-lg px-3 py-2" value={form.mandatory ? 'true' : 'false'} onChange={(e) => setForm({ ...form, mandatory: e.target.value === 'true' })}>
            <option value="false">Elective</option>
            <option value="true">Mandatory</option>
          </select>
          <select className="border rounded-lg px-3 py-2" value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: Number(e.target.value) })}>
            <option value={0}>Assign faculty</option>
            {fac.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2" value={form.timeslot_id} onChange={(e) => setForm({ ...form, timeslot_id: Number(e.target.value) })}>
            <option value={0}>Select timeslot</option>
            {ts.map((t) => <option key={t.id} value={t.id}>{t.day} {t.start_time}-{t.end_time}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2" value={form.classroom_id} onChange={(e) => setForm({ ...form, classroom_id: Number(e.target.value) })}>
            <option value={0}>Select classroom</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number} ({r.capacity})</option>)}
          </select>
          <input className="border rounded-lg px-3 py-2" placeholder="Max seats" type="number" value={form.max_seats} onChange={(e) => setForm({ ...form, max_seats: Number(e.target.value) })} />
          <div className="md:col-span-3 flex justify-end gap-2">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ code: '', name: '', credits: 0, semester: 1, mandatory: false, faculty_id: 0, timeslot_id: 0, classroom_id: 0, max_seats: 0 }) }} className="px-4 py-2 rounded-lg border">Cancel</button>
            )}
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">{editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulk} templateHeaders={headers} />

      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search by ID"
              className="border rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              disabled={searching || !searchId}
              onClick={async () => {
                if (!searchId) return
                setSearching(true)
                try {
                  const c = await CoursesAPI.get(Number(searchId))
                  setItems([c])
                } catch (e) {
                  setMessage('No course found')
                  setTimeout(() => setMessage(null), 3000)
                } finally {
                  setSearching(false)
                }
              }}
              className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
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
              {items.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">{s.code}</td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.credits}</td>
                  <td className="p-2">{s.semester}</td>
                  <td className="p-2">{String(s.mandatory)}</td>
                  <td className="p-2">{s.faculty_id}</td>
                  <td className="p-2">{s.timeslot_id}</td>
                  <td className="p-2">{s.classroom_id}</td>
                  <td className="p-2">{s.max_seats}</td>
                  <td className="p-2 text-right space-x-2">
                    <button onClick={() => startEdit(s.id)} className="text-blue-600">Edit</button>
                    <button onClick={() => remove(s.id)} className="text-red-600">Delete</button>
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


