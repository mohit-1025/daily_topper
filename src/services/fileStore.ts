import { getFile, putFile, deleteFile, clearFiles } from '@/lib/files'
import { repo } from '@/services/repository'

export async function saveUploadFile(id: string, blob: Blob, guest: boolean) {
  if (guest) return putFile(id, blob)
  return repo.putFile(id, blob)
}

export async function loadUploadFile(id: string, guest: boolean): Promise<Blob | null> {
  if (guest) return getFile(id)
  return (await repo.getFile(id)) ?? getFile(id)
}

export async function removeUploadFile(id: string, guest: boolean) {
  if (guest) return deleteFile(id)
  return repo.deleteFile(id)
}

export async function wipeUploadFiles() {
  await clearFiles()
  await repo.clearFiles()
}
