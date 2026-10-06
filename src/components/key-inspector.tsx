import { Eye, EyeOff, Fingerprint, KeyRound, PencilLine } from 'lucide-preact'
import {
  fingerprint,
  inferValueType,
  isSecretKey,
  keyState,
  maskValue,
  parseEnvironment,
  type EnvironmentWorkspace,
} from '../domain/environment'

type Props = {
  workspace: EnvironmentWorkspace
  selectedKey: string
  reveal: boolean
  onReveal: () => void
  onValue: (environmentName: string, value: string) => void
}

export function KeyInspector({ workspace, selectedKey, reveal, onReveal, onValue }: Props) {
  const secret = isSecretKey(selectedKey)
  return (
    <aside class="border-y border-slate-200 bg-white sm:border">
      <div class="border-b border-slate-200 p-4">
        <div class="flex items-start gap-3">
          <span class="grid size-9 shrink-0 place-items-center bg-sky-100 text-sky-800">
            {secret ? <KeyRound size={17} /> : <PencilLine size={17} />}
          </span>
          <div class="min-w-0">
            <p class="text-xs font-bold text-sky-700">KEY INSPECTOR</p>
            <h2 class="mt-1 break-all font-mono text-sm font-bold">{selectedKey}</h2>
          </div>
          <button
            class="ml-auto grid size-9 shrink-0 place-items-center border border-slate-300 text-slate-600"
            type="button"
            onClick={onReveal}
            aria-label={reveal ? 'Hide values' : 'Reveal values'}
            title={reveal ? 'Hide values' : 'Reveal values'}
          >
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div class="mt-4 flex items-center justify-between border border-slate-200 bg-slate-50 p-3">
          <span class="text-xs font-bold text-slate-500">COMPARISON</span>
          <strong class="text-sm">{keyState(selectedKey, workspace)}</strong>
        </div>
      </div>
      <div class="divide-y divide-slate-100">
        {workspace.environments.map((environment) => {
          const value = parseEnvironment(environment).values[selectedKey]
          return (
            <div class="p-4" key={environment.name}>
              <div class="flex items-center justify-between gap-2">
                <strong class="text-sm">{environment.name}</strong>
                <span class="text-xs text-slate-500">{inferValueType(value)}</span>
              </div>
              {value === undefined ? (
                <div class="mt-3 border border-dashed border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  Not defined in {environment.fileName}
                </div>
              ) : (
                <label class="mt-3 block">
                  <span class="sr-only">
                    {selectedKey} in {environment.name}
                  </span>
                  <input
                    class="h-10 w-full border border-slate-300 px-3 font-mono text-xs"
                    type={reveal ? 'text' : 'password'}
                    value={value}
                    onInput={(e) => onValue(environment.name, e.currentTarget.value)}
                  />
                </label>
              )}
              <p class="mt-2 flex items-center gap-2 font-mono text-xs text-slate-400">
                <Fingerprint size={14} /> {fingerprint(value)}
              </p>
              {secret && (
                <p class="mt-1 truncate font-mono text-xs text-slate-400">
                  Preview: {maskValue(value)}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
