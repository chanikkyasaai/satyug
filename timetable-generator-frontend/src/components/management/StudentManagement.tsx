import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'

type Student = {
  name: string
  rollNo: string
  program: string
  electives: string
  enrolledCredits: number
}

const STORAGE_KEY = 'students-data'

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState<Student>({ name: '', rollNo: '', program: '', electives: '', enrolledCredits: 0 })
  const headers = useMemo(() => ['name', 'rollNo', 'program', 'electives', 'enrolledCredits'], [])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setStudents(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
  }, [students])

  function addStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.rollNo) return
    setStudents((prev) => [...prev, { ...form, enrolledCredits: Number(form.enrolledCredits) }])
    setForm({ name: '', rollNo: '', program: '', electives: '', enrolledCredits: 0 })
  }

  function removeStudent(idx: number) {
    setStudents((prev) => prev.filter((_, i) => i !== idx))
  }

  function onBulk(rows: any[]) {
    const mapped: Student[] = rows.map((r) => ({
      name: String(r.name || ''),
      rollNo: String(r.rollNo || ''),
      program: String(r.program || ''),
      electives: String(r.electives || ''),
      enrolledCredits: Number(r.enrolledCredits || 0),
    })).filter((s) => s.name && s.rollNo)
    setStudents((prev) => [...prev, ...mapped])
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Student</h3>
        <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Roll No" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Program" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Electives (comma-separated)" value={form.electives} onChange={(e) => setForm({ ...form, electives: e.target.value })} />
          <input type="number" className="border rounded-lg px-3 py-2" placeholder="Enrolled Credits" value={form.enrolledCredits} onChange={(e) => setForm({ ...form, enrolledCredits: Number(e.target.value) })} />
          <div className="md:col-span-3 flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulk} templateHeaders={headers} />

      <div className="p-4 bg-white rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Students</h3>
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
              {students.map((s, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.rollNo}</td>
                  <td className="p-2">{s.program}</td>
                  <td className="p-2">{s.electives}</td>
                  <td className="p-2">{s.enrolledCredits}</td>
                  <td className="p-2 text-right"><button onClick={() => removeStudent(idx)} className="text-red-600">Delete</button></td>
                </tr>
              ))}
              {students.length === 0 && (
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


