import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'
import { StudentsAPI } from '../../api/endpoints'
import type { StudentCreate, StudentOut } from '../../types/backend'

export default function StudentManagement() {
  const [students, setStudents] = useState<StudentOut[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<StudentCreate>({ name: '', roll_number: '', email: '', year: 1, branch: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchId, setSearchId] = useState<string>('')
  const [searching, setSearching] = useState(false)
  const headers = useMemo(() => ['id', 'name', 'roll_number', 'email', 'year', 'branch'], [])

  async function refresh() {
    setLoading(true)
    try {
      const data = await StudentsAPI.list()
      setStudents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }
  const [message, setMessage] = useState<string | null>(null);

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.roll_number || !form.email) return;
    if (editingId) {
      const updated = await StudentsAPI.update(editingId, { ...form, year: Number(form.year) });
      setStudents((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      setEditingId(null);
      setForm({ name: "", roll_number: "", email: "", year: 1, branch: "" });
      showMessage(`✏️ Student "${updated.name}" updated successfully!`);
      return;
    }
    const created = await StudentsAPI.create({
      ...form,
      year: Number(form.year),
    });
    setStudents((prev) => [...prev, created]);
    setForm({ name: "", roll_number: "", email: "", year: 1, branch: "" });
    showMessage(`✅ Student "${created.name}" added successfully!`);
  }

   async function removeStudent(id: number) {
     const student = students.find((s) => s.id === id);
     await StudentsAPI.delete(id);
     setStudents((prev) => prev.filter((s) => s.id !== id));
     showMessage(`🗑️ Student "${student?.name || ""}" deleted successfully!`);
   }

  function onBulk(rows: any[]) {
    // Map CSV to StudentCreate; send sequentially (simple impl)
    const mapped: StudentCreate[] = rows.map((r) => ({
      name: String(r.name || ''),
      roll_number: String(r.roll_number || r.roll || r.rollNo || ''),
      email: String(r.email || ''),
      year: Number(r.year || 1),
      branch: String(r.branch || ''),
    })).filter((s) => s.name && s.roll_number && s.email)
    ;(async () => {
      for (const m of mapped) {
        const created = await StudentsAPI.create(m)
        setStudents((prev) => [...prev, created])
      }
    })()
  }

  async function startEdit(id: number) {
    const s = await StudentsAPI.get(id)
    setEditingId(s.id)
    setForm({ name: s.name, roll_number: s.roll_number, email: s.email, year: s.year, branch: s.branch })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 rounded-lg border bg-green-50 text-green-800 text-sm">
          {message}
        </div>
      )}
      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Student</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Roll number" value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
          <div className="md:col-span-3 flex justify-end gap-2">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', roll_number: '', email: '', year: 1, branch: '' }) }} className="px-4 py-2 rounded-lg border">Cancel</button>
            )}
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">{editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulk} templateHeaders={headers} />

      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Students</h3>
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
                  const s = await StudentsAPI.get(Number(searchId))
                  setStudents([s])
                } catch (e) {
                  showMessage('No student found')
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
              {students.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.roll_number}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.year}</td>
                  <td className="p-2">{s.branch}</td>
                  <td className="p-2 text-right space-x-2">
                    <button onClick={() => startEdit(s.id)} className="text-blue-600">Edit</button>
                    <button onClick={() => removeStudent(s.id)} className="text-red-600">Delete</button>
                  </td>
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


