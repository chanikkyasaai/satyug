import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'

type Course = {
  courseCode: string
  name: string
  type: 'Major' | 'Minor' | 'Skill' | 'Ability'
  theoryHours: number
  practicalHours: number
  credits: number
  fieldwork?: string
}

const STORAGE_KEY = 'courses-data'

export default function CourseManagement() {
  const [items, setItems] = useState<Course[]>([])
  const [form, setForm] = useState<Course>({ courseCode: '', name: '', type: 'Major', theoryHours: 0, practicalHours: 0, credits: 0, fieldwork: '' })
  const headers = useMemo(() => ['courseCode', 'name', 'type', 'theoryHours', 'practicalHours', 'credits', 'fieldwork'], [])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setItems(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.courseCode || !form.name) return
    setItems((prev) => [...prev, { ...form, theoryHours: Number(form.theoryHours), practicalHours: Number(form.practicalHours), credits: Number(form.credits) }])
    setForm({ courseCode: '', name: '', type: 'Major', theoryHours: 0, practicalHours: 0, credits: 0, fieldwork: '' })
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function onBulk(rows: any[]) {
    const mapped: Course[] = rows.map((r) => ({
      courseCode: String(r.courseCode || ''),
      name: String(r.name || ''),
      type: (['Major','Minor','Skill','Ability'].includes(String(r.type)) ? String(r.type) : 'Major') as Course['type'],
      theoryHours: Number(r.theoryHours || 0),
      practicalHours: Number(r.practicalHours || 0),
      credits: Number(r.credits || 0),
      fieldwork: String(r.fieldwork || ''),
    })).filter((s) => s.courseCode && s.name)
    setItems((prev) => [...prev, ...mapped])
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Course</h3>
        <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Course code" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="border rounded-lg px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Course['type'] })}>
            <option>Major</option>
            <option>Minor</option>
            <option>Skill</option>
            <option>Ability</option>
          </select>
          <input className="border rounded-lg px-3 py-2" placeholder="Theory hours" type="number" value={form.theoryHours} onChange={(e) => setForm({ ...form, theoryHours: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Practical hours" type="number" value={form.practicalHours} onChange={(e) => setForm({ ...form, practicalHours: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-3" placeholder="Fieldwork/Internship/Project components (optional)" value={form.fieldwork} onChange={(e) => setForm({ ...form, fieldwork: e.target.value })} />
          <div className="md:col-span-3 flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulk} templateHeaders={headers} />

      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Courses</h3>
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
                  <td className="p-2">{s.courseCode}</td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.type}</td>
                  <td className="p-2">{s.theoryHours}</td>
                  <td className="p-2">{s.practicalHours}</td>
                  <td className="p-2">{s.credits}</td>
                  <td className="p-2">{s.fieldwork}</td>
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


