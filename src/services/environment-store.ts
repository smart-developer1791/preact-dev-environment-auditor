import { del, get, set } from 'idb-keyval'
import { environmentWorkspaceSchema, type EnvironmentWorkspace } from '../domain/environment'

const samples = [
  ['Development', 'sample-development.env'],
  ['Staging', 'sample-staging.env'],
  ['Production', 'sample-production.env'],
] as const

async function loadSamples(): Promise<EnvironmentWorkspace> {
  const environments = await Promise.all(
    samples.map(async ([name, fileName]) => {
      const response = await fetch(`/${fileName}`)
      if (!response.ok) throw new Error(`Could not load ${fileName}.`)
      return { name, fileName, content: await response.text() }
    }),
  )
  return environmentWorkspaceSchema.parse({ environments })
}

export async function loadWorkspace(key: string) {
  const saved = environmentWorkspaceSchema.safeParse(await get<unknown>(key))
  if (saved.success) return saved.data
  await del(key)
  return loadSamples()
}

export async function saveWorkspace(key: string, workspace: EnvironmentWorkspace) {
  const parsed = environmentWorkspaceSchema.parse(workspace)
  await set(key, parsed)
  return parsed
}

export async function resetWorkspace(key: string) {
  await del(key)
  return loadSamples()
}
