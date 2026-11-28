// Normalise an absolute web address for the browser's saved-site editors.
export const webHref = (value) => {
  try {
    const url = new URL(String(value).trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}
