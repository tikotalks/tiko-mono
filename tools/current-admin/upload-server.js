import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env file
dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const upload = multer({ memory: true })

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5200',
  credentials: true
}))

// Simple upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Create S3 client for R2
    const client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      },
      forcePathStyle: true
    })

    // Generate a simple key
    const timestamp = Date.now()
    const key = `uploads/${timestamp}-${req.file.originalname}`

    // Upload to R2
    await client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }))

    // Return the public URL
    res.json({
      success: true,
      url: `${process.env.R2_PUBLIC_URL}/${key}`
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

app.listen(3001, () => {
  console.log('Upload server running on http://localhost:3001')
})