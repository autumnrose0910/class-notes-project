import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import PDFviewer from "../components/PDFviewer"
import API_URL from "../api"

function ClassPage({ isAdmin }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [className, setClassName] = useState("")
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)

  const [file, setFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [resources, setResources] = useState([])
  const [newResourceTitle, setNewResourceTitle] = useState("")
  const [newResourceUrl, setNewResourceUrl] = useState("")
  const [addingResource, setAddingResource] = useState(false)

  const token = localStorage.getItem("token")

  /* ===========================
     HELPERS
  =========================== */

  const getFileType = (url) => {
    const clean = (url || "").split("?")[0]
    return clean.split(".").pop()?.toLowerCase()
  }

  const isLikelyUrl = (s) => {
    try {
      new URL(s)
      return true
    } catch {
      return false
    }
  }

  /* ===========================
     FETCH CLASS
  =========================== */

  const fetchClass = async () => {
    try {
      const res = await fetch(`${API_URL}/classes/${id}`)
      const data = await res.json()
      setClassName(data?.name || "Class")
    } catch {
      setClassName("Class")
    }
  }

  /* ===========================
     FETCH DOCUMENTS
  =========================== */

  const fetchDocuments = async () => {
    const url = searchQuery
      ? `${API_URL}/documents/search?q=${encodeURIComponent(searchQuery)}&classId=${id}`
      : `${API_URL}/documents?classId=${id}`

    try {
      const res = await fetch(url)
      const data = await res.json()
      setDocuments(data)
    } catch (err) {
      console.error("Fetch documents error:", err)
    }
  }

  /* ===========================
     FETCH RESOURCES
  =========================== */

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_URL}/resources?classId=${id}`)
      const data = await res.json()
      setResources(data)
    } catch (err) {
      console.error("Fetch resources error:", err)
    }
  }

  useEffect(() => {
    fetchClass()
  }, [id])

  useEffect(() => {
    fetchDocuments()
  }, [id, searchQuery])

  useEffect(() => {
    fetchResources()
  }, [id])

  /* ===========================
     AUTO UPLOAD WHEN FILE SELECTED
  =========================== */

  useEffect(() => {
    if (!file || !isAdmin) return

    const uploadFile = async () => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", file.name)
      formData.append("classId", id)

      setSubmitting(true)

      try {
        const res = await fetch(`${API_URL}/documents/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!res.ok) throw new Error("Upload failed")

        const doc = await res.json()
        setDocuments((prev) => [doc, ...prev])
        setFile(null)
      } catch (err) {
        console.error("Upload error:", err)
        alert("Upload failed — make sure you're logged in as admin.")
      } finally {
        setSubmitting(false)
      }
    }

    uploadFile()
  }, [file])

  /* ===========================
     DELETE DOCUMENT
  =========================== */

  const handleDeleteDoc = async (docId) => {
    if (!isAdmin || !confirm("Delete this document?")) return

    try {
      await fetch(`${API_URL}/documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      if (selectedDoc?.id === docId) setSelectedDoc(null)
    } catch (err) {
      console.error("Delete doc error:", err)
      alert("Delete failed.")
    }
  }

  /* ===========================
     ADD RESOURCE
  =========================== */

  const handleAddResource = async () => {
    if (!isAdmin) return

    const title = newResourceTitle.trim()
    const url = newResourceUrl.trim()

    if (!title || !url) return
    if (!isLikelyUrl(url)) {
      alert("Please enter a valid URL (https://...)")
      return
    }

    setAddingResource(true)

    try {
      const res = await fetch(`${API_URL}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, url, classId: id }),
      })

      if (!res.ok) throw new Error("Create resource failed")

      const created = await res.json()
      setResources((prev) => [created, ...prev])
      setNewResourceTitle("")
      setNewResourceUrl("")
    } catch (err) {
      console.error("Add resource error:", err)
      alert("Add resource failed.")
    } finally {
      setAddingResource(false)
    }
  }

  /* ===========================
     DELETE RESOURCE
  =========================== */

  const handleDeleteResource = async (resourceId) => {
    if (!isAdmin || !confirm("Delete this resource?")) return

    try {
      await fetch(`${API_URL}/resources/${resourceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setResources((prev) => prev.filter((r) => r.id !== resourceId))
    } catch (err) {
      console.error("Delete resource error:", err)
    }
  }

  /* ===========================
     RENDER
  =========================== */

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <img
        src="/mascot.png"
        alt="Mascot"
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 w-20 h-auto cursor-pointer z-50"
      />

      <div className="max-w-7xl mx-auto pl-24">
        <h1 className="text-5xl text-mocha mb-6">{className}</h1>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

          {/* SIDEBAR */}
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-butter h-fit">

            <h2 className="text-xl text-mocha mb-4">Files</h2>

            {/* Upload Button */}
            {isAdmin && (
              <div className="mb-6">
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files[0]
                    if (selected) setFile(selected)
                  }}
                />

                <button
                  onClick={() => document.getElementById("fileUpload").click()}
                  className="w-full bg-peach px-4 py-2 rounded-xl"
                >
                  {submitting ? "Uploading..." : "Upload File"}
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded-xl border border-sand"
            />

            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="cursor-pointer px-4 py-3 rounded-xl hover:bg-sand"
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate text-sm">{doc.title}</span>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDoc(doc.id)
                        }}
                        className="text-xs text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* RESOURCES */}
            <div className="mt-8 pt-6 border-t border-sand">
              <h2 className="text-xl text-mocha mb-4">
                Recommended Resources
              </h2>

              {resources.map((r) => (
                <div key={r.id} className="flex justify-between items-center mb-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-mocha underline truncate"
                  >
                    {r.title}
                  </a>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteResource(r.id)}
                      className="text-xs text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {isAdmin && (
                <div className="mt-4 space-y-2">
                  <input
                    placeholder="Title"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                  <input
                    placeholder="https://..."
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                  <button
                    onClick={handleAddResource}
                    className="w-full bg-peach px-4 py-2 rounded-xl"
                  >
                    {addingResource ? "Adding..." : "Add Resource"}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* VIEWER */}
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-butter">
            {selectedDoc ? (
              <>
                {getFileType(selectedDoc.fileUrl) === "pdf" && (
                  <PDFviewer fileUrl={selectedDoc.fileUrl} />
                )}

                {["png", "jpg", "jpeg"].includes(getFileType(selectedDoc.fileUrl)) && (
                  <img
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.title}
                    className="w-full"
                  />
                )}
              </>
            ) : (
              <div className="text-center text-latte">
                Select a file to view
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default ClassPage


