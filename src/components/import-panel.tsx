import { FileUp, TriangleAlert } from 'lucide-preact'
import { parseEnvironment, typoSuggestions, type EnvironmentWorkspace } from '../domain/environment'

type Props = {
  workspace: EnvironmentWorkspace
  onImport: (environment: string, file: File) => void
}

export function ImportPanel({ workspace, onImport }: Props) {
  const suggestions = typoSuggestions(workspace)
  return (
    <section class="grid gap-4 lg:grid-cols-2">
      <div class="border-y border-slate-200 bg-white p-4 sm:border sm:p-5">
        <div class="flex items-center gap-2">
          <FileUp class="text-sky-700" size={19} />
          <h2 class="font-bold">Replace environment files</h2>
        </div>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          Choose a local <code>.env</code> file for any slot. Parsing and comparison stay in the
          browser.
        </p>
        <div class="mt-4 space-y-3">
          {workspace.environments.map((environment) => (
            <label
              class="flex cursor-pointer items-center gap-3 border border-slate-200 p-3 hover:bg-slate-50"
              key={environment.name}
            >
              <span class="min-w-0">
                <strong class="block text-sm">{environment.name}</strong>
                <span class="block truncate text-xs text-slate-500">
                  {environment.fileName} ·{' '}
                  {Object.keys(parseEnvironment(environment).values).length} keys
                </span>
              </span>
              <span class="ml-auto shrink-0 border border-slate-300 px-3 py-2 text-xs font-bold">
                Choose file
              </span>
              <input
                class="sr-only"
                type="file"
                accept=".env,text/plain"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0]
                  if (file) onImport(environment.name, file)
                }}
              />
            </label>
          ))}
        </div>
      </div>
      <div class="border-y border-slate-200 bg-white p-4 sm:border sm:p-5">
        <div class="flex items-center gap-2">
          <TriangleAlert class="text-amber-600" size={19} />
          <h2 class="font-bold">Possible naming mistakes</h2>
        </div>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          Rare keys are compared with keys present in multiple environments.
        </p>
        <div class="mt-4 space-y-3">
          {suggestions.map((item) => (
            <div class="border border-amber-200 bg-amber-50 p-3" key={item.key}>
              <p class="font-mono text-xs font-bold text-amber-900">{item.key}</p>
              <p class="mt-1 text-sm text-amber-800">
                Did you mean <code>{item.suggestion}</code>?
              </p>
            </div>
          ))}
          {!suggestions.length && (
            <p class="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              No likely key-name typos detected.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
