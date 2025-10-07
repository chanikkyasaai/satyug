import { useEffect, useMemo, useState } from 'react'
import BulkUpload from './BulkUpload'
import { FacultyAPI } from '../../api/endpoints'
import type { FacultyCreate, FacultyOut } from '../../types/backend'

export default function FacultyManagement() {
  const [items, setItems] = useState<FacultyOut[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FacultyCreate>({ name: '', email: '', expertise: '', workload_cap: 0, available: true })
  const headers = useMemo(() => ['id', 'name', 'email', 'expertise', 'workload_cap', 'available', 'current_workload'], [])
  const [searchId, setSearchId] = useState<string>('')
  const [searching, setSearching] =  useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const data = await FacultyAPI.list()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  function showMessage(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) return
    if (editingId) {
      const updated = await FacultyAPI.update(editingId, { ...form, workload_cap: Number(form.workload_cap) })
      setItems((prev) => prev.map((f) => (f.id === editingId ? updated : f)))
      setForm({ name: '', email: '', expertise: '', workload_cap: 0, available: true })
      setEditingId(null)
      showMessage(`✏️ Faculty "${updated.name}" updated successfully!`)
      return
    }
    const created = await FacultyAPI.create({ ...form, workload_cap: Number(form.workload_cap) })
    setItems((prev) => [...prev, created])
    setForm({ name: '', email: '', expertise: '', workload_cap: 0, available: true })
    showMessage(`✅ Faculty "${created.name}" added successfully!`)
  }

  async function remove(id: number) {
    await FacultyAPI.delete(id)
    setItems((prev) => prev.filter((f) => f.id !== id))
  }

  function onBulk(rows: any[]) {
    const mapped: FacultyCreate[] = rows.map((r) => ({
      name: String(r.name || ''),
      email: String(r.email || ''),
      expertise: String(r.expertise || r.specialization || ''),
      workload_cap: Number(r.workload_cap || r.maxWorkload || 0),
      available: String(r.available || 'true').toLowerCase() !== 'false',
    })).filter((s) => s.name && s.email)
    ;(async () => {
      for (const m of mapped) {
        const created = await FacultyAPI.create(m)
        setItems((prev) => [...prev, created])
      }
    })()
  }

  async function startEdit(id: number) {
    const f = await FacultyAPI.get(id)
    setEditingId(f.id)
    setForm({ name: f.name, email: f.email, expertise: f.expertise, workload_cap: f.workload_cap, available: f.available })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 rounded-lg border bg-green-50 text-green-800 text-sm">{message}</div>
      )}
      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Faculty</h3>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <form
          onSubmit={addItem}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Expertise"
            value={form.expertise}
            onChange={(e) => setForm({ ...form, expertise: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Workload cap"
            type="number"
            value={form.workload_cap}
            onChange={(e) =>
              setForm({ ...form, workload_cap: Number(e.target.value) })
            }
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={form.available ? "true" : "false"}
            onChange={(e) =>
              setForm({ ...form, available: e.target.value === "true" })
            }
          >
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
          <div className="md:col-span-3 flex justify-end gap-2">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', email: '', expertise: '', workload_cap: 0, available: true }) }} className="px-4 py-2 rounded-lg border">Cancel</button>
            )}
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      <BulkUpload onDataParsed={onBulk} templateHeaders={headers} />

      <div className="p-4 bg-white rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Faculty</h3>
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
                if (!searchId) return;
                setSearching(true);
                try {
                  const s = await FacultyAPI.get(Number(searchId));
                  setItems([s]);
                } catch (e) {
                  showMessage("No faculty found");
                } finally {
                  setSearching(false);
                }
              }}
              className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
              {searching ? "Searching…" : "Search"}
            </button>
            <button onClick={refresh} className="text-sm text-blue-600">
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((h) => (
                  <th key={h} className="text-left p-2 border-b capitalize">
                    {h}
                  </th>
                ))}
                <th className="p-2 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.expertise}</td>
                  <td className="p-2">{s.workload_cap}</td>
                  <td className="p-2">{String(s.available)}</td>
                  <td className="p-2">{s.current_workload}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => startEdit(s.id)}
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    className="p-3 text-gray-500"
                    colSpan={headers.length + 1}
                  >
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


