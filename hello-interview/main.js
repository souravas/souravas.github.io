import { webHref } from '../shared/web-url.js'

// Keep the key used by the original Start bookmark prompt.
const KEY = 'start:hello-interview'
const form = document.getElementById('edit')
const input = document.getElementById('url')
const status = document.getElementById('status')

const load = () => {
  try {
    return webHref(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const href = webHref(input.value)
  if (!href) {
    status.textContent = 'Paste a full link beginning with http:// or https://.'
    return
  }
  try {
    localStorage.setItem(KEY, href)
  } catch {
    status.textContent = 'This browser could not save the link. Check its site data settings and try again.'
    return
  }
  location.replace(href)
})

const open = () => {
  const href = load()
  if (href && location.hash !== '#edit') {
    location.replace(href)
    return
  }
  input.value = href ?? ''
  form.hidden = false
}

if (document.prerendering) document.addEventListener('prerenderingchange', open, { once: true })
else open()
