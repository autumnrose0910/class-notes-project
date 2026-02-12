import { useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

function PDFviewer({ fileUrl }) {
  const containerRef = useRef(null)

  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  /* ===========================
     LOAD PDF
  =========================== */

  useEffect(() => {
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl)
      const loadedPdf = await loadingTask.promise
      setPdf(loadedPdf)
      setNumPages(loadedPdf.numPages)
    }

    loadPdf()
  }, [fileUrl])

  /* ===========================
     TRACK CONTAINER WIDTH
  =========================== */

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener("resize", updateWidth)

    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  /* ===========================
     RENDER ALL PAGES RESPONSIVELY
  =========================== */

  useEffect(() => {
    if (!pdf || !containerWidth) return

    const renderAllPages = async () => {
      containerRef.current.innerHTML = ""

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)

        const viewport = page.getViewport({ scale: 1 })
        const scale = containerWidth / viewport.width

        const scaledViewport = page.getViewport({ scale })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        canvas.className =
          "mb-10 rounded-2xl shadow-lg border border-butter bg-white w-full"

        containerRef.current.appendChild(canvas)

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise
      }
    }

    renderAllPages()
  }, [pdf, numPages, containerWidth])

  return (
    <div className="flex flex-col items-center w-full">
      <div
        ref={containerRef}
        className="w-full max-w-4xl"
      />
    </div>
  )
}

export default PDFviewer

