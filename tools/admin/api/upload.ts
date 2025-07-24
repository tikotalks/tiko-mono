import express from 'express'
import multer from 'multer'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const router = express.Router()
const upload = multer({ memory: true })

// This endpoint handles uploads without CORS issues
router.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: 'https://dc2b7d14a69351375cab6de9a13ddee9.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY!
      },
      forcePathStyle: true
    })

    const key = `uploads/${new Date().toISOString().split('T')[0]}/${Date.now()}-${file.originalname}`

    const command = new PutObjectCommand({
      Bucket: 'media',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })

    await client.send(command)

    res.json({
      success: true,
      key,
      url: `https://media.tikocdn.org/${key}`
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

export default router