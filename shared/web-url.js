// Normalise an absolute address for the browser's saved-site editors.
const normaliseHref = (value, protocols) => {
  try {
    const url = new URL(String(value).trim())
    return protocols.includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

const WEB_PROTOCOLS = ['https:', 'http:']
const WEB_AND_FILE_PROTOCOLS = [...WEB_PROTOCOLS, 'file:']

export const webHref = (value) => normaliseHref(value, WEB_PROTOCOLS)
export const webOrFileHref = (value) => normaliseHref(value, WEB_AND_FILE_PROTOCOLS)
