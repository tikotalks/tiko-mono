import express from 'express'
import cors from 'cors'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import multer from 'multer'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const upload = multer({ memory: true })

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:5200', 'http://localhost:5201'],
  credentials: true
}))

// R2 upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      },
      forcePathStyle: true
    })

    const date = new Date().toISOString().split('T')[0]
    const key = `uploads/${date}/${req.file.originalname}`

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    })

    await client.send(command)

    res.json({
      success: true,
      key,
      url: `${process.env.R2_PUBLIC_URL}/${key}`
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed', details: error.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Upload server running on http://localhost:${PORT}`)
})