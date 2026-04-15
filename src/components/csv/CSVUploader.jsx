import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function CSVUploader({ onParsed, label = 'Upload CSV', accept = '.csv' }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function processFile(file) {
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onParsed(results.data)
      },
    })
  }

  function handleChange(e) {
    processFile(e.target.files?.[0])
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        aria-label={label}
        className="sr-only"
        id="csv-file-input"
      />
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
          dragging
            ? 'border-primary bg-primary-50 text-primary'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
    </div>
  )
}
