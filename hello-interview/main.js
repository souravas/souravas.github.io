import { webOrFileHref } from '../shared/web-url.js'
import { readFile, saveFile } from './saved-file.js'

// Keep the key used by the original Start bookmark prompt.
const KEY = 'start:hello-interview'
const LOCAL_FILE = 'local-file'
const NATIVE_TYPES = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
const form = document.getElementById('edit')
const input = document.getElementById('url')
const status = document.getElementById('status')
const picker = document.getElementById('choose-file')
const fileSection = document.getElementById('local-file')
const filename = document.getElementById('filename')
const viewer = document.getElementById('file-viewer')
let previewUrl
let request = 0

const load = () => {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === LOCAL_FILE ? saved : webOrFileHref(saved)
  } catch {
    return null
  }
}

const clearPreview = () => {
  viewer.replaceChildren()
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl)
    previewUrl = undefined
  }
  fileSection.hidden = true
}

const showFile = (file) => {
  const frame = document.createElement('iframe')
  frame.title = file.name
  frame.referrerPolicy = 'no-referrer'
  if (NATIVE_TYPES.includes(file.type)) {
    previewUrl = URL.createObjectURL(file)
    frame.src = previewUrl
  } else {
    // Active documents run in an opaque origin without access to the site's storage.
    const content = /\.html?$/i.test(file.name) ? new Blob([file], { type: 'text/html' }) : file
    frame.setAttribute('sandbox', 'allow-scripts')
    frame.src = '/hello-interview-file-viewer.html'
    frame.addEventListener('load', () => frame.contentWindow.postMessage(content, '*'), { once: true })
  }
  viewer.replaceChildren(frame)
  filename.textContent = file.name
  form.hidden = true
  fileSection.hidden = false
}

const open = async () => {
  const current = ++request
  const saved = load()
  clearPreview()
  let message = ''
  if (location.hash !== '#edit') {
    if (saved === LOCAL_FILE) {
      const file = await readFile().catch(() => null)
      if (current !== request) return
      if (file) {
        showFile(file)
        return
      }
      message = 'The saved copy is unavailable. Choose the local file again.'
    } else if (saved?.startsWith('file:')) {
      message = 'Choose this file below to open it in your browser.'
    } else if (saved) {
      location.replace(saved)
      return
    }
  }
  input.value = saved === LOCAL_FILE ? '' : (saved ?? '')
  status.textContent = message
  form.hidden = false
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const href = webOrFileHref(input.value)
  if (!href) {
    status.textContent = 'Paste a full link beginning with http://, https:// or file://.'
    return
  }
  try {
    localStorage.setItem(KEY, href)
  } catch {
    status.textContent = 'This browser could not save the link. Check its site data settings and try again.'
    return
  }
  if (href.startsWith('file:')) {
    status.textContent = 'Choose this file below to open it in your browser.'
    picker.focus()
  } else {
    location.replace(href)
  }
})

picker.addEventListener('change', async () => {
  const file = picker.files[0]
  picker.value = ''
  if (!file) return
  const saveLink = form.querySelector('button[type="submit"]')
  picker.disabled = true
  saveLink.disabled = true
  try {
    await saveFile(file)
    localStorage.setItem(KEY, LOCAL_FILE)
  } catch {
    status.textContent = 'This browser could not keep a copy of the file. Check its site data settings and try again.'
    return
  } finally {
    picker.disabled = false
    saveLink.disabled = false
  }
  if (location.hash === '#edit') history.replaceState(null, '', location.pathname + location.search)
  open()
})

addEventListener('hashchange', open)
if (document.prerendering) document.addEventListener('prerenderingchange', open, { once: true })
else open()
