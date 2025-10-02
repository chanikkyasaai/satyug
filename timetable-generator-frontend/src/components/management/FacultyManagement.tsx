import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'

type Faculty = {
  name: string
  specialization: string
  availabilitySlots: string
  maxWorkload: number
  preferredCourses: string
}

const STORAGE_KEY = 'faculty-data'

export default function FacultyManagement() {
  const [items, setItems] = useState<Faculty[]>([])
  const [form, setForm] = useState<Faculty>({ name: '', specialization: '', availabilitySlots: '', maxWorkload: 0, preferredCourses: '' })
  const headers = useMemo(() => ['name', 'specialization', 'availabilitySlots', 'maxWorkload', 'preferredCourses'], [])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setItems(JSON.parse(raw))
  }, [])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setItems((prev) => [...prev, { ...form, maxWorkload: Number(form.maxWorkload) }])
    setForm({ name: '', specialization: '', availabilitySlots: '', maxWorkload: 0, preferredCourses: '' })
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function onBulk(rows: any[]) {
    const mapped: Faculty[] = rows.map((r) => ({
      name: String(r.name || ''),
      specialization: String(r.specialization || ''),
      availabilitySlots: String(r.availabilitySlots || ''),
      maxWorkload: Number(r.maxWorkload || 0),
      preferredCourses: String(r.preferredCourses || ''),
    })).filter((s) => s.name)
    setItems((prev) => [...prev, ...mapped])
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Faculty</h3>
        <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Max Workload (credits/hours)" type="number" value={form.maxWorkload} onChange={(e) => setForm({ ...form, maxWorkload: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Availability slots (e.g., Mon 9-11, Tue 2-4)" value={form.availabilitySlots} onChange={(e) => setForm({ ...form, availabilitySlots: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Preferred course allocations" value={form.preferredCourses} onChange={(e) => setForm({ ...form, preferredCourses: e.target.value })} />
          <div className="md:col-span-3 flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulk} templateHeaders={headers} />

      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty</h3>
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
              {items.map((s, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.specialization}</td>
                  <td className="p-2">{s.availabilitySlots}</td>
                  <td className="p-2">{s.maxWorkload}</td>
                  <td className="p-2">{s.preferredCourses}</td>
                  <td className="p-2 text-right"><button onClick={() => remove(idx)} className="text-red-600">Delete</button></td>
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


