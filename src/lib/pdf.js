import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'

/** 1024 → "1 KB" */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Baca & validasi satu file PDF.
 * Balikin { buffer, pageCount }, atau throw kalau bukan PDF valid / kena password.
 */
export async function loadPdfMeta(file) {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer)
  return { buffer, pageCount: doc.getPageCount() }
}

/**
 * Gabungkan beberapa PDF jadi satu.
 * @param {Array<{ buffer: ArrayBuffer }>} items — tiap item punya `buffer` hasil loadPdfMeta
 * @returns {Promise<Uint8Array>} bytes PDF hasil gabungan
 */
export async function mergePdfs(items) {
  const merged = await PDFDocument.create()
  for (const item of items) {
    const src = await PDFDocument.load(item.buffer)
    const pages = await merged.copyPages(src, src.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }
  return merged.save()
}

/**
 * Ambil halaman tertentu dari PDF jadi file baru.
 * @param {ArrayBuffer|Uint8Array} buffer — PDF asli
 * @param {number[]} keepIndices — index halaman (0-based) yang dipertahankan, urutan naik
 */
export async function slicePdf(buffer, keepIndices) {
  const src = await PDFDocument.load(buffer)
  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, keepIndices)
  for (const page of pages) {
    out.addPage(page)
  }
  return out.save()
}

/**
 * Parse range halaman gaya manusia: "1-3, 7, 10-12" → index 0-based.
 * Throw Error dengan pesan ramah kalau format salah / halaman nggak ada.
 */
export function parsePageRange(text, pageCount) {
  const indices = new Set()
  for (const part of text.split(',')) {
    const token = part.trim()
    if (!token) continue
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      let start = Number(range[1])
      let end = Number(range[2])
      if (start > end) [start, end] = [end, start]
      for (let p = start; p <= end; p++) {
        if (p < 1 || p > pageCount) {
          throw new Error(`Halaman ${p} nggak ada — PDF-nya cuma ${pageCount} halaman.`)
        }
        indices.add(p - 1)
      }
    } else if (/^\d+$/.test(token)) {
      const p = Number(token)
      if (p < 1 || p > pageCount) {
        throw new Error(`Halaman ${p} nggak ada — PDF-nya cuma ${pageCount} halaman.`)
      }
      indices.add(p - 1)
    } else {
      throw new Error(`Format "${token}" belum kenal. Contoh bener: 1-3, 7, 10-12`)
    }
  }
  return [...indices].sort((a, b) => a - b)
}

/**
 * Susun ulang halaman + tambah rotasi.
 * @param {ArrayBuffer|Uint8Array} buffer — PDF asli
 * @param {Array<{ srcIndex: number, rotation: number }>} order — urutan baru; rotation = tambahan derajat (0/90/180/270)
 */
export async function arrangePages(buffer, order) {
  const src = await PDFDocument.load(buffer)
  const out = await PDFDocument.create()
  const copied = await out.copyPages(
    src,
    order.map((o) => o.srcIndex),
  )
  copied.forEach((page, i) => {
    const extra = order[i].rotation ?? 0
    if (extra) {
      const angle = (((page.getRotation().angle + extra) % 360) + 360) % 360
      page.setRotation(degrees(angle))
    }
    out.addPage(page)
  })
  return out.save()
}

const A4 = { width: 595.28, height: 841.89 }

/**
 * Gabungkan gambar-gambar jadi PDF.
 * @param {Array<{ data: ArrayBuffer, mime: string }>} items — hasil fileToEmbeddable
 * @param {object} [opts]
 * @param {'a4'|'fit'} [opts.pageMode] — 'a4' = tiap gambar di A4 rapi di tengah, 'fit' = halaman pas ukuran gambar
 * @param {number} [opts.margin] — margin pt kalau mode a4
 */
export async function imagesToPdf(items, { pageMode = 'a4', margin = 24 } = {}) {
  const doc = await PDFDocument.create()
  for (const item of items) {
    const img = item.mime === 'image/png' ? await doc.embedPng(item.data) : await doc.embedJpg(item.data)
    if (pageMode === 'fit') {
      const page = doc.addPage([img.width, img.height])
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
      continue
    }
    const page = doc.addPage([A4.width, A4.height])
    const scale = Math.min(
      (A4.width - margin * 2) / img.width,
      (A4.height - margin * 2) / img.height,
      1, // gambar kecil nggak dipaksa membesar — biar nggak buram
    )
    const w = img.width * scale
    const h = img.height * scale
    page.drawImage(img, {
      x: (A4.width - w) / 2,
      y: (A4.height - h) / 2,
      width: w,
      height: h,
    })
  }
  return doc.save()
}

/**
 * Tempel nomor halaman ke tiap halaman.
 * Posisi dihitung di ruang tampilan (view) lalu dipetakan ke ruang koordinat PDF asli,
 * sehingga tetap bener walau halaman punya /Rotate.
 * @param {ArrayBuffer|Uint8Array} buffer
 * @param {object} [opts]
 * @param {'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'} [opts.position]
 * @param {'n'|'slash'|'label'} [opts.format] — '1' | '1 / 12' | 'Halaman 1'
 * @param {number} [opts.size] — pt
 * @param {boolean} [opts.bold]
 * @param {'black'|'white'} [opts.color]
 * @param {number} [opts.start] — angka awal halaman pertama
 * @param {boolean} [opts.skipFirst]
 * @param {number} [opts.margin] — jarak tepi dalam pt (arah tampilan)
 */
export async function stampPageNumbers(buffer, opts = {}) {
  const {
    position = 'bottom-center',
    format = 'n',
    size = 11,
    bold = false,
    color = 'black',
    start = 1,
    skipFirst = false,
    margin = 22,
  } = opts

  const doc = await PDFDocument.load(buffer)
  const font = await doc.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica)
  const ink = color === 'white' ? rgb(1, 1, 1) : rgb(0, 0, 0)
  const [vertical, horizontal] = position.split('-')

  const pages = doc.getPages()
  const total = pages.length

  pages.forEach((page, i) => {
    if (skipFirst && i === 0) return

    const n = start + i
    const text =
      format === 'slash' ? `${n} / ${total}` : format === 'label' ? `Halaman ${n}` : `${n}`

    const rot = (((page.getRotation().angle % 360) + 360) % 360)
    const pw = page.getWidth()
    const ph = page.getHeight()
    const swap = rot === 90 || rot === 270
    const vw = swap ? ph : pw
    const vh = swap ? pw : ph
    const tw = font.widthOfTextAtSize(text, size)

    // posisi di ruang tampilan (y dari bawah)
    const vx =
      horizontal === 'left' ? margin : horizontal === 'right' ? vw - margin - tw : (vw - tw) / 2
    const vy = vertical === 'top' ? vh - margin - size : margin

    // pemetaan view → ruang PDF asli, sesuai rotasi halaman
    let ux
    let uy
    let angle
    if (rot === 90) {
      ux = pw - vy
      uy = vx
      angle = 90
    } else if (rot === 180) {
      ux = pw - vx
      uy = ph - vy
      angle = 180
    } else if (rot === 270) {
      ux = vy
      uy = ph - vx
      angle = 270
    } else {
      ux = vx
      uy = vy
      angle = 0
    }

    page.drawText(text, {
      x: ux,
      y: uy,
      size,
      font,
      color: ink,
      rotate: degrees(angle),
    })
  })

  return doc.save()
}

/** Download blob sebagai file di browser. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
