const DB_NAME = 'daily-topper-files'
const STORE = 'files'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function putFile(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (error) {
    console.warn('Could not persist file in IndexedDB', error)
  }
}

export async function getFile(id: string): Promise<Blob | null> {
  try {
    const db = await openDb()
    const result = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return result
  } catch {
    return null
  }
}

export async function deleteFile(id: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* noop */
  }
}

export async function clearFiles(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* noop */
  }
}

export function svgToBlob(svg: string): Blob {
  return new Blob([svg], { type: 'image/svg+xml' })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
