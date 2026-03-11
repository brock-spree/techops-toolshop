import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@spreetail/spreeform'
import { Loader2, ExternalLink } from 'lucide-react'
import { sendToSpark, onSparkMessage } from '../lib/spark-messaging'
import type { ResolvedManifest } from '../types/manifest'
import type { SparkMessage } from '../lib/spark-messaging'

interface SparkLauncherProps {
  resolved: ResolvedManifest | null
  onClose: () => void
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export function SparkLauncher({ resolved, onClose }: SparkLauncherProps) {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  const spark = resolved?.manifest.surfaces?.spark
  const isOpen = !!resolved && !!spark

  const loadSparkBundle = useCallback(() => {
    if (!spark || !containerRef.current) return

    setLoadState('loading')
    setErrorMessage('')

    // Clean up previous script if any
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }

    const script = document.createElement('script')
    script.src = spark.component
    // Use classic script (not module) so document.currentScript is available
    // during execution — sparks use it to detect their app's base URL
    script.onload = () => {
      if (!containerRef.current) return

      // Create the web component custom element
      const tagName = `spreelet-spark-${resolved!.manifest.id}`
      const existingEl = containerRef.current.querySelector(tagName)

      if (!existingEl) {
        if (customElements.get(tagName)) {
          const el = document.createElement(tagName)
          containerRef.current.appendChild(el)
          setLoadState('ready')
        } else {
          // Wait for custom element to be defined (up to 5s)
          const timeout = setTimeout(() => {
            setLoadState('error')
            setErrorMessage(
              `Spark component <${tagName}> not registered within timeout`,
            )
          }, 5000)

          customElements.whenDefined(tagName).then(() => {
            clearTimeout(timeout)
            if (!containerRef.current) return
            const el = document.createElement(tagName)
            containerRef.current.appendChild(el)
            setLoadState('ready')
          })
        }
      } else {
        setLoadState('ready')
      }
    }
    script.onerror = () => {
      setLoadState('error')
      setErrorMessage(`Failed to load Spark bundle from ${spark.component}`)
    }

    document.head.appendChild(script)
    scriptRef.current = script
  }, [spark, resolved])

  // Load the spark bundle when the dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(loadSparkBundle, 50)
      return () => clearTimeout(timer)
    } else {
      setLoadState('idle')
      setErrorMessage('')
    }
  }, [isOpen, loadSparkBundle])

  // Send theme info to Spark when loaded
  useEffect(() => {
    if (loadState === 'ready') {
      const isDark = document.documentElement.classList.contains('dark')
      sendToSpark({ type: 'theme-change', payload: { theme: isDark ? 'dark' : 'light' } })
    }
  }, [loadState])

  // Listen for Spark messages
  useEffect(() => {
    if (!isOpen) return

    return onSparkMessage((message: SparkMessage) => {
      switch (message.type) {
        case 'open-full': {
          const url = resolved?.manifest.surfaces?.full?.url ?? resolved?.manifest.url
          if (url) window.open(url, '_blank')
          onClose()
          break
        }
        case 'request-resize':
          break
      }
    })
  }, [isOpen, resolved, onClose])

  // Clean up: remove children safely on close
  const handleClose = () => {
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild)
      }
    }
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }
    onClose()
  }

  // Clean up script on unmount
  useEffect(() => {
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove()
        scriptRef.current = null
      }
    }
  }, [])

  if (!resolved || !spark) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="overflow-hidden p-0"
        style={{
          maxWidth: spark.maxWidth,
          maxHeight: spark.maxHeight,
        }}
      >
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <DialogTitle>{resolved.manifest.name}</DialogTitle>
            <a
              href={resolved.manifest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <DialogDescription className="sr-only">
            Quick view of {resolved.manifest.name}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          className="min-h-[200px] px-6 pb-6"
          style={{
            maxHeight: spark.maxHeight - 80,
            overflowY: 'auto',
          }}
        >
          {loadState === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {loadState === 'error' && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <p className="text-xs text-muted-foreground">
                The Spark component isn&apos;t available yet.{' '}
                <a
                  href={resolved.manifest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Open the full app instead
                </a>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
