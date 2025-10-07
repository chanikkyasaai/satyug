import { useRef } from 'react'

type BulkUploadProps = {
  onDataParsed: (rows: any[]) => void
  templateHeaders: string[]
}

export default function BulkUpload({ onDataParsed, templateHeaders }: BulkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const data = ev.target?.result
      if (!data) return

      const text = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer)
      const rows = parseCsv(text)
      if (rows.length && templateHeaders.length) {
        const normalized = rows.map((r) => normalizeRow(r, templateHeaders))
        onDataParsed(normalized)
      } else {
        onDataParsed(rows)
      }
    }
    reader.readAsText(file)
  }

  function parseCsv(text: string): any[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length === 0) return []
    const headers = lines[0].split(',').map((h) => h.trim())
    const result: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCsvLine(lines[i])
      if (cells.length === 1 && cells[0] === '') continue
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = (cells[idx] ?? '').trim()
      })
      result.push(row)
    }
    return result
  }

  function splitCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current)
    return result
  }

  function normalizeRow(row: any, headers: string[]) {
    const normalized: Record<string, string> = {}
    headers.forEach((h) => {
      const key = Object.keys(row).find((k) => k.trim().toLowerCase() === h.trim().toLowerCase())
      normalized[h] = key ? String(row[key]) : ''
    })
    return normalized
  }

  function downloadTemplate() {
    const csv = templateHeaders.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-700 font-medium">Bulk upload (CSV)</p>
          <p className="text-xs text-gray-500">First row should contain headers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="px-3 py-1.5 rounded-lg border bg-white text-gray-700 text-sm hover:bg-gray-50">Download template</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Upload CSV</button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
    </div>
  )
}


