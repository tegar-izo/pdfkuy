/**
 * Gambar → bytes yang bisa dieembed pdf-lib.
 * pdf-lib cuma ngerti PNG & JPG; format lain (WebP, GIF, HEIC, dst.)
 * di-roundtrip lewat canvas dulu dan keluar sebagai JPG (latar putih).
 */
export function isImageFile(file) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(file.name)
}

/**
 * @returns {Promise<{ data: ArrayBuffer, mime: 'image/png'|'image/jpeg', width: number, height: number }>}
 * throws kalau file bukan gambar valid / gagal dibuka browser.
 */
export async function fileToEmbeddable(file) {
  if (file.type === 'image/png' || file.type === 'image/jpeg') {
    // PNG/JPG orisil — tanpa rekoding, ukuran file terjaga
    const bitmap = await createImageBitmap(file)
    const dims = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return { data: await file.arrayBuffer(), mime: file.type, ...dims }
  }

  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d', { alpha: false })
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0)
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('gagal encode'))), 'image/jpeg', 0.92),
    )
    return {
      data: await blob.arrayBuffer(),
      mime: 'image/jpeg',
      width: bitmap.width,
      height: bitmap.height,
    }
  } finally {
    bitmap.close()
  }
}
