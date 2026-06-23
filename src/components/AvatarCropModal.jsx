import { useState, useRef, useCallback } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button, Modal, Spinner } from './ui'

function canvasFromCrop(img, crop) {
  const s = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = crop.width * s
  canvas.height = crop.height * s
  const ctx = canvas.getContext('2d')
  ctx.scale(s, s)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return canvas
}

function canvasToBlob(canvas) {
  return new Promise((ok, fail) => canvas.toBlob((b) => b ? ok(b) : fail(new Error('blob failed')), 'image/webp', 0.85))
}

export default function AvatarCropModal({ open, file, onClose, onSaved }) {
  const [img, setImg] = useState(null)
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 })
  const imgRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // load the file as an image
  useCallback(() => {
    if (!open || !file) return
    setErr('')
    setBusy(false)
    const reader = new FileReader()
    reader.onload = (e) => { setImg(e.target.result); setCrop({ unit: '%', width: 80, height: 80, x: 10, y: 10 }) }
    reader.readAsDataURL(file)
    return () => { if (img) URL.revokeObjectURL(img) }
  }, [open, file])

  const onLoad = useCallback((e) => { imgRef.current = e.target }, [])

  async function save() {
    setBusy(true)
    setErr('')
    try {
      const canvas = canvasFromCrop(imgRef.current, crop)
      const blob = await canvasToBlob(canvas)
      if (blob.size > 1048576) throw new Error('Resulting image exceeds 1 MB. Crop tighter or use a smaller image.')
      onSaved?.(blob)
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Crop avatar">
      <div className="space-y-4">
        {img ? (
          <ReactCrop crop={crop} onChange={setCrop} aspect={1} circularCrop keepSelection onImageLoaded={onLoad}>
            <img src={img} alt="" className="max-h-[50vh] w-full object-contain" />
          </ReactCrop>
        ) : (
          <div className="grid h-40 place-items-center"><Spinner /></div>
        )}
        {err && <p className="text-sm text-clay">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy || !img}>{busy ? <Spinner /> : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
