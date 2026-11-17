/* ============================================================
   /downloads: opens a list of sites as /cloud, /ipo and /invest
   do (../shared/opener.js), but the list is kept in this
   browser's localStorage, never in the page or the repository.

   With a list, the page writes it into .sites and loads the
   opener, which opens the first in this tab and the rest in new
   ones. Without one, or at #edit, it shows the editor instead: a
   box of addresses, one per line, which Save stores (dropping
   #edit from the address, so a reload opens them), and an
   import that fills the box from a browser's bookmarks export,
   taking the links in its folder named Downloads. The file is
   read here and goes nowhere.

   Only http and https addresses are kept, and only from the box
   or the file: nothing in the page's URL ever adds one, so no
   souravas.com link can send a visitor elsewhere.
   ============================================================ */

const KEY = 'downloads:sites'

const list = document.getElementById('sites')
const blocked = document.getElementById('blocked')
const form = document.getElementById('edit')
const box = document.getElementById('urls')
const status = document.getElementById('status')
const file = document.getElementById('import')

// The web addresses among some lines, normalised; the rest are dropped.
const clean = (lines) =>
  lines.flatMap((line) => {
    try {
      const url = new URL(String(line).trim())
      return url.protocol === 'https:' || url.protocol === 'http:' ? [url.href] : []
    } catch {
      return []
    }
  })

// localStorage can be missing or throw (a private window, blocked site data).
const load = () => {
  try {
    const sites = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(sites) ? clean(sites) : []
  } catch {
    return []
  }
}

const save = (sites) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(sites))
    return true
  } catch {
    return false
  }
}

const plural = (n) => `${n} site${n === 1 ? '' : 's'}`

// Each site a link named by its host, as on the other opener pages.
const render = (sites) => {
  list.replaceChildren(
    ...sites.map((href) => {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = href
      a.target = '_blank'
      a.textContent = new URL(href).host
      li.append(a)
      return li
    }),
  )
}

const edit = () => {
  if (!form.hidden) return
  list.hidden = true
  blocked.hidden = true
  box.value = load().join('\n')
  form.hidden = false
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const lines = box.value.split('\n').filter((line) => line.trim())
  const sites = clean(lines)
  const skipped = lines.length - sites.length
  box.value = sites.join('\n')
  if (!save(sites)) {
    status.textContent = 'This browser would not keep the list: a private window, or site data blocked for souravas.com.'
    return
  }
  // Saved from #edit, the address would open the editor again; without
  // it, a reload opens the sites, as the line below says.
  if (location.hash === '#edit') history.replaceState(null, '', location.pathname + location.search)
  status.textContent =
    (sites.length ? `Saved ${plural(sites.length)}. They open the next time this page loads.` : 'Saved an empty list.') +
    (skipped ? ` Left out ${skipped} line${skipped === 1 ? '' : 's'} that ${skipped === 1 ? 'was not a web address' : 'were not web addresses'}.` : '')
})

// A bookmarks export (the Netscape format every browser writes): a
// folder is an <h3> followed by the <dl> of its links and subfolders.
file.addEventListener('change', async () => {
  const chosen = file.files[0]
  file.value = ''
  if (!chosen) return
  const doc = new DOMParser().parseFromString(await chosen.text(), 'text/html')
  const folder = [...doc.querySelectorAll('h3')].find((h3) => h3.textContent.trim().toLowerCase() === 'downloads')
  let links = folder?.nextElementSibling
  while (links && links.tagName !== 'DL') links = links.nextElementSibling
  if (!links) {
    status.textContent = 'That file has no folder named Downloads.'
    return
  }
  const sites = clean([...links.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))
  box.value = sites.join('\n')
  status.textContent = `Found ${plural(sites.length)} in Downloads. Save keeps them.`
})

addEventListener('hashchange', () => {
  if (location.hash === '#edit') edit()
})

const sites = load()
render(sites)
if (location.hash === '#edit' || !sites.length) edit()
else import('../shared/opener.js')
