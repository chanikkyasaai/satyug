import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'

type Infra = {
  room: string
  capacity: number
  type: 'Classroom' | 'Lab'
  labType?: string
  availability?: string
  teachingPracticeCenter?: 'B.Ed.' | 'M.Ed.' | 'ITEP' | ''
}

const STORAGE_KEY = 'infrastructure-data'

export default function InfrastructureManagement() {
  const [items, setItems] = useState<Infra[]>([])
  const [form, setForm] = useState<Infra>({ room: '', capacity: 0, type: 'Classroom', labType: '', availability: '', teachingPracticeCenter: '' })
  const headers = useMemo(() => ['room', 'capacity', 'type', 'labType', 'availability', 'teachingPracticeCenter'], [])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setItems(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.room) return
    setItems((prev) => [...prev, { ...form, capacity: Number(form.capacity) }])
    setForm({ room: '', capacity: 0, type: 'Classroom', labType: '', availability: '', teachingPracticeCenter: '' })
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function onBulk(rows: any[]) {
    const mapped: Infra[] = rows.map((r) => ({
      room: String(r.room || ''),
      capacity: Number(r.capacity || 0),
      type: (['Classroom','Lab'].includes(String(r.type)) ? String(r.type) : 'Classroom') as Infra['type'],
      labType: String(r.labType || ''),
      availability: String(r.availability || ''),
      teachingPracticeCenter: (['B.Ed.','M.Ed.','ITEP'].includes(String(r.teachingPracticeCenter)) ? String(r.teachingPracticeCenter) : '') as Infra['teachingPracticeCenter'],
    })).filter((s) => s.room)
    setItems((prev) => [...prev, ...mapped])
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Infrastructure</h3>
        <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Room/Lab name" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          <select className="border rounded-lg px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Infra['type'] })}>
            <option>Classroom</option>
            <option>Lab</option>
          </select>
          <input className="border rounded-lg px-3 py-2" placeholder="Lab type (if Lab)" value={form.labType} onChange={(e) => setForm({ ...form, labType: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Availability (days/slots)" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
          <select className="border rounded-lg px-3 py-2" value={form.teachingPracticeCenter} onChange={(e) => setForm({ ...form, teachingPracticeCenter: e.target.value as Infra['teachingPracticeCenter'] })}>
            <option value="">Teaching practice center (optional)</option>
            <option>B.Ed.</option>
            <option>M.Ed.</option>
            <option>ITEP</option>
          </select>
          <div className="md:col-span-3 flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulk} templateHeaders={headers} />

      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure</h3>
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
                  <td className="p-2">{s.room}</td>
                  <td className="p-2">{s.capacity}</td>
                  <td className="p-2">{s.type}</td>
                  <td className="p-2">{s.labType}</td>
                  <td className="p-2">{s.availability}</td>
                  <td className="p-2">{s.teachingPracticeCenter}</td>
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


