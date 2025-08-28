export async function exportPdf(payload: any): Promise<Blob> {
  const res = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Export failed')
  return await res.blob()
}

