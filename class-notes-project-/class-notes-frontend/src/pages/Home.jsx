import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import API_URL from "../api"


function Home({ isAdmin }) {
  const [classes, setClasses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [selectedColor, setSelectedColor] = useState("#ffd4c4")
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState("")

  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const colorOptions = [
    "#ffd4c4",
    "#ffc4e1",
    "#c4f4dd",
    "#fff9c4",
    "#c4d4ff",
    "#ffe4c4",
    "#d4f4c4",
    "#e4c4ff",
  ]

  const fetchClasses = async () => {
    const res = await fetch('${API_URL}/classes')
    const data = await res.json()
    setClasses(data)
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  /* ===========================
     CREATE CLASS --admin only function
  =========================== */

  const handleCreateClass = async () => {
    if (!isAdmin || !newClassName.trim()) return

    const res = await fetch(`${API_URL}/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newClassName,
        color: selectedColor,
      }),
    })

    const created = await res.json()
    setClasses(prev => [...prev, created])
    setNewClassName("")
    setSelectedColor("#ffd4c4")
    setShowModal(false)
  }

  /* ===========================
     DELETE CLASS --admin only function
  =========================== */

  const handleDelete = async (id) => {
    if (!isAdmin) return
    if (!confirm("Delete this class?")) return

    await fetch(`http://localhost:3001/classes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setClasses(prev => prev.filter(c => c.id !== id))
  }

  /* ===========================
     EDIT CLASS --admin only function
  =========================== */

  const handleSaveEdit = async (id) => {
    if (!isAdmin) return

    const res = await fetch(`http://localhost:3001/classes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: editingName }),
    })

    const updated = await res.json()

    setClasses(prev =>
      prev.map(c => (c.id === id ? updated : c))
    )

    setEditingId(null)
    setEditingName("")
  }

  return (
    <div className="relative min-h-screen bg-cream px-6 md:px-12 py-12">

      {/* logo */}
      <img
        src="/mascot.png"
        alt="Mascot"
        onClick={() => navigate("/")}
        className="
          w-32 sm:w-40 md:w-48 lg:w-56 xl:w-64
          h-auto
          object-contain
          drop-shadow-lg
          hover:scale-105
          transition-all duration-300
          cursor-pointer
          z-50
        "
      />

      {/* Header */}
      <div className="text-center mb-16 max-w-4xl mx-auto">
        <div className="inline-block px-5 py-2 bg-sand rounded-full text-latte text-sm mb-6 shadow-sm">
          Study Space
        </div>

        <h1 className="font-serifDisplay text-4xl md:text-6xl text-mocha mb-4">
          Class Collections
        </h1>

        <p className="text-latte text-base md:text-lg mb-8">
          organize notes & class resources
        </p>

        {/* CREATE BUTTON --admin only function */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 bg-peach text-mocha rounded-xl shadow-soft hover:scale-105 transition font-medium"
          >
            + Create New Class
          </button>
        )}
      </div>

      {/* Class Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {classes.map(cls => (
          <div
            key={cls.id}
            className="bg-white rounded-3xl p-8 border border-butter shadow-soft hover:shadow-lg transition-all"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm"
              style={{ backgroundColor: cls.color || "#f4e4c1" }}
            >
              <span className="font-serifDisplay font-bold text-mocha">
                {cls.name?.[0]?.toUpperCase() || "C"}
              </span>
            </div>

            <h2
              onClick={() => navigate(`/class/${cls.id}`)}
              className="font-serifDisplay text-2xl text-mocha mb-3 cursor-pointer hover:underline"
            >
              {cls.name}
            </h2>

            {/* EDIT + DELETE --admin only function */}
            {isAdmin && (
              <div className="flex gap-4 text-sm">
                <button
                  onClick={() => {
                    setEditingId(cls.id)
                    setEditingName(cls.name)
                  }}
                  className="text-latte hover:text-mocha"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(cls.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL --admin only function) */}
      {isAdmin && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">

            <h2 className="font-serifDisplay text-2xl text-mocha mb-6">
              Create New Class
            </h2>

            <input
              placeholder="Class name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-sand mb-6"
            />

            <div className="grid grid-cols-4 gap-3 mb-6">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`h-12 rounded-xl transition ${
                    selectedColor === color
                      ? "ring-2 ring-mocha"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              onClick={handleCreateClass}
              className="w-full px-6 py-3 bg-peach text-mocha rounded-xl shadow-soft hover:scale-105 transition"
            >
              Create Class
            </button>
          </div>
        </div>
      )}

      {/* copyright */}
      <footer className="text-center mt-16 pt-6 border-t border-sand text-sm text-latte">
        ©AutumnMcCombs--2026
      </footer>
    </div>
  )
}

export default Home

