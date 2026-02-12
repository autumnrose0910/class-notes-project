import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import PDFviewer from "../components/PDFviewer"

function ClassPage({ isAdmin }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [className, setClassName] = useState("")
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)

  const [newTitle, setNewTitle] = useState("")
  const [file, setFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Recommended resources arrays
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
    return clean.split(".").pop().toLowerCase()
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
      ? `http://localhost:3001/documents/search?q=${encodeURIComponent(
          searchQuery
        )}&classId=${id}`
      : `http://localhost:3001/documents?classId=${id}`

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
     UPLOAD --admin only function
  =========================== */

  const handleUpload = async () => {
    if (!isAdmin) return
    if (!newTitle || !file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", newTitle)
    formData.append("classId", id)

    setSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/documents/upload`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")
      const doc = await res.json()

      setDocuments((prev) => [doc, ...prev])
      setNewTitle("")
      setFile(null)
    } catch (err) {
      console.error("Upload error:", err)
      alert("Upload failed — make sure you're logged in as admin.")
    } finally {
      setSubmitting(false)
    }
  }

  /* ===========================
     DELETE DOCUMENT --admin only function
  =========================== */

  const handleDeleteDoc = async (docId) => {
    if (!isAdmin) return
    if (!confirm("Delete this document?")) return

    try {
      await fetch(`${API_URL}/documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setDocuments((prev) => prev.filter((d) => d.id !== docId))

      if (selectedDoc?.id === docId) {
        setSelectedDoc(null)
      }
    } catch (err) {
      console.error("Delete doc error:", err)
      alert("Delete failed — make sure you're logged in as admin.")
    }
  }

  /* ===========================
     CREATE RESOURCE --admin only function
  =========================== */

  const handleAddResource = async () => {
    if (!isAdmin) return

    const title = newResourceTitle.trim()
    const url = newResourceUrl.trim()

    if (!title || !url) return
    if (!isLikelyUrl(url)) {
      alert("Please enter a valid URL (starting with https://...)")
      return
    }

    setAddingResource(true)

    try {
      const res = await fetch(`${API_URL}/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          url,
          classId: id,
        }),
      })

      if (!res.ok) throw new Error("Create resource failed")

      const created = await res.json()
      setResources((prev) => [created, ...prev])
      setNewResourceTitle("")
      setNewResourceUrl("")
    } catch (err) {
      console.error("Add resource error:", err)
      alert("Add resource failed — make sure you're logged in as admin.")
    } finally {
      setAddingResource(false)
    }
  }

  /* ===========================
     DELETE RESOURCE --admin only function
  =========================== */

  const handleDeleteResource = async (resourceId) => {
    if (!isAdmin) return
    if (!confirm("Delete this resource?")) return

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
      alert("Delete failed — make sure you're logged in as admin.")
    }
  }

  /* ===========================
     RENDER
  =========================== */

  return (
    <div className="min-h-screen bg-cream px-6 py-10 transition-all duration-300">
      {/* logo */}
      <img
        src="/mascot.png"
        alt="Mascot"
        onClick={() => navigate("/")}
        className="
          fixed top-6 left-6
          w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32
          h-auto
          object-contain
          drop-shadow-lg
          hover:scale-105
          transition-all duration-300
          cursor-pointer
          z-50
        "
      />

      <div className="max-w-7xl mx-auto pl-24 md:pl-32">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="font-serifDisplay text-5xl text-mocha mb-2">
            {className}
          </h1>
          <p className="text-latte text-lg">
            study materials
          </p>
        </div>

        {/* RESPONSIVE GRID */}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* SIDEBAR */}
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-butter h-fit">
            <h2 className="font-serifDisplay text-xl text-mocha mb-4">
              Files
            </h2>

            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded-xl border border-sand focus:outline-none focus:ring-2 focus:ring-butter"
            />

            <div className="space-y-2">
              {documents.length === 0 ? (
                <div className="text-center text-latte py-8 text-sm">
                  No files yet
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`
                      cursor-pointer px-4 py-3 rounded-xl transition-all
                      ${
                        selectedDoc?.id === doc.id
                          ? "bg-peach text-mocha shadow-sm"
                          : "hover:bg-sand text-mocha"
                      }
                    `}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate font-medium text-sm">
                        {doc.title}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDoc(doc.id)
                          }}
                          className="text-xs text-red-400 hover:text-red-600 transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RECOMMENDED RESOURCES */}
            <div className="mt-10 pt-6 border-t border-sand">
              <h2 className="font-serifDisplay text-xl text-mocha mb-4">
                Recommended Resources
              </h2>

              {resources.length === 0 ? (
                <div className="text-sm text-latte">No resources yet</div>
              ) : (
                <div className="space-y-2">
                  {resources.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-sand transition"
                    >
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-mocha hover:underline truncate"
                        title={r.url}
                      >
                        {r.title}
                      </a>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteResource(r.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    placeholder="Resource title"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand text-sm focus:outline-none focus:ring-2 focus:ring-butter"
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand text-sm focus:outline-none focus:ring-2 focus:ring-butter"
                  />
                  <button
                    onClick={handleAddResource}
                    disabled={addingResource || !newResourceTitle || !newResourceUrl}
                    className="w-full px-4 py-2 bg-peach text-mocha rounded-xl text-sm hover:bg-butter transition shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingResource ? "Adding..." : "Add Resource"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* viewer */}
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-butter min-h-[60vh] flex flex-col">
            {/* UPLOAD SECTION --admin only function */}
            {isAdmin && (
              <div className="mb-6 border-b border-sand pb-6">
                <h3 className="font-serifDisplay text-lg text-mocha mb-4">
                  Upload New Document
                </h3>

                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Document title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-sand focus:outline-none focus:ring-2 focus:ring-butter"
                  />

                  <label className="flex-1 px-4 py-3 rounded-xl border border-sand cursor-pointer hover:border-butter transition flex items-center justify-center text-latte hover:text-mocha">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.mp4"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                    />
                    <span className="text-sm">{file ? file.name : "Choose file"}</span>
                  </label>

                  <button
                    onClick={handleUpload}
                    disabled={submitting || !newTitle || !file}
                    className="px-6 py-3 bg-peach hover:bg-butter text-mocha rounded-xl transition shadow-soft disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            )}

            {/* viewer */}
            <div className="flex-1 flex justify-center items-start overflow-auto">
              {selectedDoc ? (
                <div className="w-full max-w-4xl">
                  <div className="mb-4 pb-4 border-b border-sand">
                    <h3 className="font-serifDisplay text-2xl text-mocha">
                      {selectedDoc.title}
                    </h3>
                  </div>

                  {getFileType(selectedDoc.fileUrl) === "pdf" && (
                    <PDFviewer fileUrl={selectedDoc.fileUrl} />
                  )}

                  {["png", "jpg", "jpeg"].includes(getFileType(selectedDoc.fileUrl)) && (
                    <img
                      src={selectedDoc.fileUrl}
                      alt={selectedDoc.title}
                      className="w-full rounded-xl shadow-soft"
                    />
                  )}

                  {getFileType(selectedDoc.fileUrl) === "mp4" && (
                    <video controls className="w-full rounded-xl shadow-soft">
                      <source src={selectedDoc.fileUrl} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  )}

                  {/* unknown types fallback */}
                  {!["pdf", "png", "jpg", "jpeg", "mp4"].includes(getFileType(selectedDoc.fileUrl)) && (
                    <div className="text-latte text-sm">
                      Preview not available.{" "}
                      <a
                        href={selectedDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mocha underline"
                      >
                        Open file
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center mt-20">
                  <div className="w-20 h-20 bg-sand rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">˙𐃷˙</span>
                  </div>
                  <p className="text-latte text-lg">Select a file to view</p>
                  <p className="text-latte text-sm mt-2">
                    {isAdmin ? "or upload a new one above" : "and it will appear here"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClassPage

