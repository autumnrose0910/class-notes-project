import { useEffect, useState } from "react"
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import ClassPage from "./pages/ClassPage"
import "./App.css"

function App() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsAdmin(true)
    }
  }, [])

  const loginAdmin = async () => {
    const password = prompt("Enter admin password:")

    if (!password) return

    const res = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    })

    const data = await res.json()

    if (data.token) {
      localStorage.setItem("token", data.token)
      setIsAdmin(true)
    } else {
      alert("Incorrect password")
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setIsAdmin(false)
  }

  return (
    <div className="relative">

      {/* Admin access control */}
      <div className="fixed top-6 right-6 z-50">
        {isAdmin ? (
          <button
            onClick={logout}
            className="
              text-xs px-4 py-2
              bg-white/80 backdrop-blur-md
              border border-butter
              rounded-full
              text-mocha
              shadow-soft
              hover:bg-peach
              transition-all
            "
          >
            Admin Mode ✓
          </button>
        ) : (
          <button
            onClick={loginAdmin}
            className="
              text-xs px-4 py-2
              bg-white/60 backdrop-blur-sm
              border border-sand
              rounded-full
              text-latte
              shadow-soft
              hover:text-mocha
              hover:bg-white/80
              transition-all
            "
          >
            Admin Login
          </button>
        )}
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home isAdmin={isAdmin} />} />
        <Route path="/class/:id" element={<ClassPage isAdmin={isAdmin} />} />
      </Routes>

    </div>
  )
}

export default App

