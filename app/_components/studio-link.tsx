"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

const STUDIO_URL = "https://www.yuvabestudios.com/"

export function StudioLink() {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    navigator.clipboard.writeText(STUDIO_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={STUDIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="caps-meta text-muted-foreground hover:text-foreground transition-colors duration-100"
      >
        yuvabestudios.com ↗
      </a>
      <button
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy link"}
        className="p-0.5 text-muted-foreground hover:text-foreground transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        {copied
          ? <Check className="h-3 w-3 text-[#3F6B3F]" strokeWidth={2} />
          : <Copy className="h-3 w-3" strokeWidth={1.75} />
        }
      </button>
    </div>
  )
}
