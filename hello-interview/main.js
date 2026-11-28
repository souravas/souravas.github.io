import { webOrFileHref } from '../shared/web-url.js'

// Keep the key used by the original Start bookmark prompt.
const KEY = 'start:hello-interview'
const form = document.getElementById('edit')
const input = document.getElementById('url')
const status = document.getElementById('status')
const fileLink = document.getElementById('file-link')
const fileUrl = document.getElementById('file-url')
const openFile = document.getElementById('open-file')
const fileStatus = document.getElementById('file-status')

const load = () => {
  try {
    return webOrFileHref(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

const openSavedLink = (href) => {
  if (!href.startsWith('file:')) {
    location.replace(href)
    return
  }
  // A hosted page can save a file URL even when the browser blocks navigation to it.
  fileUrl.value = href
  openFile.href = href
  fileStatus.textContent = ''
  fileLink.hidden = false
  form.hidden = true
}

const open = () => {
  const href = load()
  if (href && location.hash !== '#edit') {
    openSavedLink(href)
    return
  }
  input.value = href ?? ''
  status.textContent = ''
  fileLink.hidden = true
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
  if (location.hash === '#edit') history.replaceState(null, '', location.pathname + location.search)
  openSavedLink(href)
  if (!fileLink.hidden) openFile.focus()
})

document.getElementById('copy-file').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(fileUrl.value)
    fileStatus.textContent = 'URL copied.'
  } catch {
    fileUrl.focus()
    fileUrl.select()
    fileStatus.textContent = 'Copy the selected URL and paste it into the address bar.'
  }
})

addEventListener('hashchange', open)
if (document.prerendering) document.addEventListener('prerenderingchange', open, { once: true })
else open()
