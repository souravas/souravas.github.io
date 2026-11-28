const STORE = 'files'
const SLOT = 'hello-interview'

const transact = async (mode, requestFile) => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('hello-interview', 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const request = requestFile(transaction.objectStore(STORE))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    db.close()
  }
}

export const readFile = () => transact('readonly', (store) => store.get(SLOT))
export const saveFile = (file) => transact('readwrite', (store) => store.put(file, SLOT))
