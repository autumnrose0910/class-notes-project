import express from "express"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import multer from "multer"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config()

const app = express()
const prisma = new PrismaClient()

app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "https://class-notes-project.vercel.app"
    ],
    credentials: true,
  })
)

app.use(express.json())

/* ===========================
   SUPABASE CLIENT
=========================== */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/* ===========================
   AUTH MIDDLEWARE
=========================== */

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: "No token provided" })

  const token = authHeader.split(" ")[1]

  try {
    jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}

/* ===========================
   MULTER (MEMORY STORAGE)
=========================== */

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "video/mp4"
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Unsupported file type"), false)
    }
  }
})

/* ===========================
   ADMIN LOGIN
=========================== */

app.post("/auth/login", (req, res) => {
  const { password } = req.body

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" })
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  })

  res.json({ token })
})

/* ===========================
   CLASSES
=========================== */

app.get("/classes", async (req, res) => {
  const classes = await prisma.class.findMany({
    orderBy: { id: "desc" }
  })
  res.json(classes)
})

app.post("/classes", authMiddleware, async (req, res) => {
  const { name, color } = req.body

  const newClass = await prisma.class.create({
    data: { name, color }
  })

  res.json(newClass)
})

app.put("/classes/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id)

  const updated = await prisma.class.update({
    where: { id },
    data: req.body
  })

  res.json(updated)
})

app.delete("/classes/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id)

  await prisma.class.delete({
    where: { id }
  })

  res.json({ success: true })
})

/* ===========================
   DOCUMENTS
=========================== */

app.get("/documents", async (req, res) => {
  const { classId } = req.query

  const documents = await prisma.document.findMany({
    where: { classId: Number(classId) },
    orderBy: { createdAt: "desc" }
  })

  res.json(documents)
})

app.get("/documents/search", async (req, res) => {
  const { q, classId } = req.query

  const documents = await prisma.document.findMany({
    where: {
      classId: Number(classId),
      title: { contains: q || "" }
    },
    orderBy: { createdAt: "desc" }
  })

  res.json(documents)
})

app.post("/documents/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { title, classId } = req.body
    const file = req.file

    if (!file || !title || !classId) {
      return res.status(400).json({ error: "Missing fields" })
    }

    const fileName = `${Date.now()}-${file.originalname}`

    const { error } = await supabase.storage
      .from("class-notes")  // your existing bucket
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const { data } = supabase.storage
      .from("class-notes")
      .getPublicUrl(fileName)

    const newDoc = await prisma.document.create({
      data: {
        title,
        classId: Number(classId),
        fileUrl: data.publicUrl
      }
    })

    res.json(newDoc)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Upload failed" })
  }
})

app.delete("/documents/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id)

  await prisma.document.delete({
    where: { id }
  })

  res.json({ success: true })
})

/* ===========================
   RESOURCES
=========================== */

app.get("/resources", async (req, res) => {
  const { classId } = req.query

  const resources = await prisma.resource.findMany({
    where: { classId: Number(classId) },
    orderBy: { createdAt: "desc" }
  })

  res.json(resources)
})

app.post("/resources", authMiddleware, async (req, res) => {
  const { title, url, classId } = req.body

  const resource = await prisma.resource.create({
    data: {
      title,
      url,
      classId: Number(classId)
    }
  })

  res.json(resource)
})

app.delete("/resources/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id)

  await prisma.resource.delete({
    where: { id }
  })

  res.json({ success: true })
})

/* ===========================
   START SERVER
=========================== */
const PORT = process.env.PORT || 3001

app.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on port ${PORT}`)
})

