import { parse, stringify } from 'envfile'
import levenshtein from 'fast-levenshtein'
import { z } from 'zod'

export const environmentDocumentSchema = z.object({
  name: z.string().min(1),
  fileName: z.string().min(1),
  content: z.string(),
})

export const environmentWorkspaceSchema = z
  .object({
    environments: z.array(environmentDocumentSchema).min(2),
  })
  .superRefine((workspace, context) => {
    const names = new Set(workspace.environments.map((environment) => environment.name))
    if (names.size !== workspace.environments.length) {
      context.addIssue({
        code: 'custom',
        path: ['environments'],
        message: 'Environment names must be unique.',
      })
    }
  })

export type EnvironmentDocument = z.infer<typeof environmentDocumentSchema>
export type EnvironmentWorkspace = z.infer<typeof environmentWorkspaceSchema>
export type KeyState = 'Consistent' | 'Different' | 'Missing' | 'Secret'

export function parseEnvironment(document: EnvironmentDocument) {
  try {
    return { values: parse(document.content), error: '' }
  } catch (error) {
    return {
      values: {} as Record<string, string>,
      error: error instanceof Error ? error.message : 'Invalid environment file',
    }
  }
}

export function environmentKeys(workspace: EnvironmentWorkspace) {
  const keys = new Set<string>()
  workspace.environments.forEach((document) =>
    Object.keys(parseEnvironment(document).values).forEach((key) => keys.add(key)),
  )
  return [...keys].sort()
}

export function isSecretKey(key: string) {
  return /(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|SIGNING|CREDENTIAL)/i.test(key)
}

export function keyState(key: string, workspace: EnvironmentWorkspace): KeyState {
  const values = workspace.environments.map((document) => parseEnvironment(document).values[key])
  if (values.some((value) => value === undefined)) return 'Missing'
  if (isSecretKey(key)) return 'Secret'
  return new Set(values).size === 1 ? 'Consistent' : 'Different'
}

export function inferValueType(value?: string) {
  if (value === undefined) return 'missing'
  if (/^(true|false)$/i.test(value)) return 'boolean'
  if (/^-?\d+(\.\d+)?$/.test(value)) return 'number'
  if (/^https?:\/\//.test(value)) return 'URL'
  if (/^[\[{].*[\]}]$/.test(value)) return 'JSON-like'
  return 'string'
}

export function maskValue(value?: string) {
  if (value === undefined) return 'Not defined'
  if (value.length <= 4) return '••••••••'
  return `${value.slice(0, 2)}••••••${value.slice(-2)}`
}

export function fingerprint(value?: string) {
  if (value === undefined) return 'missing'
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `fp_${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function updateEnvironmentValue(document: EnvironmentDocument, key: string, value: string) {
  const parsed = parseEnvironment(document)
  if (parsed.error) throw new Error(`Fix ${document.fileName} before editing its values.`)
  const values = parsed.values
  return { ...document, content: stringify({ ...values, [key]: value }) }
}

export function typoSuggestions(workspace: EnvironmentWorkspace) {
  const keys = environmentKeys(workspace)
  const counts = new Map(
    keys.map((key) => [
      key,
      workspace.environments.filter((document) => key in parseEnvironment(document).values).length,
    ]),
  )
  return keys.flatMap((key) => {
    if ((counts.get(key) ?? 0) !== 1) return []
    const match = keys
      .filter((candidate) => candidate !== key && (counts.get(candidate) ?? 0) > 1)
      .map((candidate) => ({ candidate, distance: levenshtein.get(key, candidate) }))
      .sort((a, b) => a.distance - b.distance)[0]
    return match && match.distance <= 2 ? [{ key, suggestion: match.candidate }] : []
  })
}

export function auditStats(workspace: EnvironmentWorkspace) {
  const keys = environmentKeys(workspace)
  const states = keys.map((key) => keyState(key, workspace))
  return {
    keys: keys.length,
    consistent: states.filter((state) => state === 'Consistent').length,
    different: states.filter((state) => state === 'Different').length,
    missing: states.filter((state) => state === 'Missing').length,
    secrets: states.filter((state) => state === 'Secret').length,
  }
}
