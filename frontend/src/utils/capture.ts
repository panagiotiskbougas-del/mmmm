export async function captureChartsAsBase64(ids: string[]): Promise<string[]> {
  const imgs: string[] = []
  for (const id of ids) {
    const container = document.getElementById(id)
    if (!container) { imgs.push(''); continue }
    const canvas = container.querySelector('canvas') as HTMLCanvasElement | null
    imgs.push(canvas ? canvas.toDataURL('image/png') : '')
  }
  return imgs
}

