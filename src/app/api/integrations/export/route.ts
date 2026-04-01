import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase-admin'
import sharp from 'sharp'
import PDFDocument from 'pdfkit'

export const maxDuration = 120

async function verifyUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const token = await getAuth().verifyIdToken(authHeader.split('Bearer ')[1])
    return token.uid
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const userId = await verifyUser(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { imageUrls, format, quality, generationId } = body as {
    imageUrls: string[]
    format: 'png' | 'jpg' | 'webp' | 'pdf'
    quality?: number
    generationId: string
  }

  if (!imageUrls?.length || !format || !generationId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (imageUrls.length > 30) {
    return NextResponse.json({ error: 'Maximum 30 images per export' }, { status: 400 })
  }

  const safeQuality = Math.min(100, Math.max(1, quality || 90))

  try {
    // Download all images
    const imageBuffers: Buffer[] = []
    for (const url of imageUrls) {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to download image: ${url}`)
      const ab = await res.arrayBuffer()
      imageBuffers.push(Buffer.from(ab))
    }

    if (format === 'pdf') {
      return await exportAsPdf(imageBuffers, generationId, userId)
    }

    if (imageBuffers.length === 1) {
      return await exportSingleImage(imageBuffers[0], format, safeQuality, generationId, userId, 0)
    }

    // Multiple images — create a zip-like bundle by exporting each and returning download URLs
    const exportedUrls: string[] = []
    for (let i = 0; i < imageBuffers.length; i++) {
      const result = await exportSingleImage(imageBuffers[i], format, safeQuality, generationId, userId, i)
      const data = await result.json()
      exportedUrls.push(data.downloadUrl)
    }

    return NextResponse.json({
      downloadUrls: exportedUrls,
      format,
      totalFiles: exportedUrls.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Export failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function exportSingleImage(
  buffer: Buffer,
  format: 'png' | 'jpg' | 'webp',
  quality: number,
  generationId: string,
  userId: string,
  index: number
): Promise<NextResponse> {
  let processed: Buffer
  let mimeType: string

  switch (format) {
    case 'png':
      processed = await sharp(buffer).png({ quality }).toBuffer()
      mimeType = 'image/png'
      break
    case 'jpg':
      processed = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer()
      mimeType = 'image/jpeg'
      break
    case 'webp':
      processed = await sharp(buffer).webp({ quality }).toBuffer()
      mimeType = 'image/webp'
      break
    default:
      throw new Error(`Unsupported format: ${format}`)
  }

  const fileName = `export_${index}.${format}`
  const filePath = `exports/${userId}/${generationId}/${fileName}`
  const bucket = adminStorage.bucket()
  const file = bucket.file(filePath)

  await file.save(processed, { contentType: mimeType, public: true })
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

  return NextResponse.json({
    downloadUrl,
    format,
    fileSize: processed.length,
    fileName,
  })
}

async function exportAsPdf(
  imageBuffers: Buffer[],
  generationId: string,
  userId: string
): Promise<NextResponse> {
  const imageDimensions = await Promise.all(
    imageBuffers.map(async (buf) => {
      const meta = await sharp(buf).metadata()
      return { width: meta.width || 800, height: meta.height || 600 }
    })
  )

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks)
      const filePath = `exports/${userId}/${generationId}/export.pdf`
      const bucket = adminStorage.bucket()
      const file = bucket.file(filePath)

      await file.save(pdfBuffer, { contentType: 'application/pdf', public: true })
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

      resolve(
        NextResponse.json({
          downloadUrl,
          format: 'pdf',
          fileSize: pdfBuffer.length,
          fileName: 'export.pdf',
        })
      )
    })
    doc.on('error', reject)

    // Add each image as a page
    for (let i = 0; i < imageBuffers.length; i++) {
      const { width, height } = imageDimensions[i]
      doc.addPage({ size: [width, height] })
      doc.image(imageBuffers[i], 0, 0, { width, height })
    }

    doc.end()
  })
}
