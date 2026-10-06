import { Search } from 'lucide-preact'
import {
  environmentKeys,
  keyState,
  maskValue,
  parseEnvironment,
  type EnvironmentWorkspace,
  type KeyState,
} from '../domain/environment'

const stateStyles: Record<KeyState, string> = {
  Consistent: 'bg-emerald-100 text-emerald-800',
  Different: 'bg-amber-100 text-amber-800',
  Missing: 'bg-red-100 text-red-800',
  Secret: 'bg-blue-100 text-blue-800',
}

type Props = {
  workspace: EnvironmentWorkspace
  selectedKey: string
  query: string
  filter: string
  reveal: boolean
  onQuery: (value: string) => void
  onFilter: (value: string) => void
  onSelect: (key: string) => void
}

export function EnvironmentMatrix(props: Props) {
  const keys = environmentKeys(props.workspace).filter(
    (key) =>
      key.toLowerCase().includes(props.query.toLowerCase()) &&
      (props.filter === 'All' || keyState(key, props.workspace) === props.filter),
  )
  return (
    <section class="border-y border-slate-200 bg-white sm:border">
      <div class="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[minmax(220px,1fr)_180px]">
        <label class="relative">
          <span class="sr-only">Search environment keys</span>
          <Search class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16} />
          <input
            class="h-10 w-full border border-slate-300 bg-slate-50 pr-3 pl-9 text-sm"
            value={props.query}
            onInput={(e) => props.onQuery(e.currentTarget.value)}
            placeholder="Search configuration keys"
          />
        </label>
        <label>
          <span class="sr-only">Filter key status</span>
          <select
            class="h-10 w-full border border-slate-300 bg-white px-3 text-sm font-semibold"
            value={props.filter}
            onChange={(e) => props.onFilter(e.currentTarget.value)}
          >
            {['All', 'Missing', 'Different', 'Secret', 'Consistent'].map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </label>
      </div>
      <div class="hidden overflow-x-auto md:block">
        <table class="w-full min-w-[900px] border-collapse text-left">
          <thead class="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th class="w-64 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-500">
                KEY
              </th>
              {props.workspace.environments.map((environment) => (
                <th
                  class="border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-500"
                  key={environment.name}
                >
                  {environment.name.toUpperCase()}
                </th>
              ))}
              <th class="w-28 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-500">
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const state = keyState(key, props.workspace)
              return (
                <tr
                  class={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${props.selectedKey === key ? 'bg-sky-50' : ''}`}
                  onClick={() => props.onSelect(key)}
                  key={key}
                >
                  <th class="px-4 py-3 font-mono text-xs font-bold text-slate-700">{key}</th>
                  {props.workspace.environments.map((environment) => {
                    const value = parseEnvironment(environment).values[key]
                    return (
                      <td
                        class="max-w-64 truncate px-4 py-3 font-mono text-xs text-slate-500"
                        title={props.reveal ? value : undefined}
                        key={environment.name}
                      >
                        {props.reveal ? (value ?? 'Not defined') : maskValue(value)}
                      </td>
                    )
                  })}
                  <td class="px-4 py-3">
                    <span class={`inline-block px-2 py-1 text-xs font-bold ${stateStyles[state]}`}>
                      {state}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div class="divide-y divide-slate-100 md:hidden">
        {keys.map((key) => {
          const state = keyState(key, props.workspace)
          return (
            <button
              class={`block w-full p-4 text-left ${props.selectedKey === key ? 'border-l-4 border-l-sky-700 bg-sky-50 pl-3' : ''}`}
              type="button"
              onClick={() => props.onSelect(key)}
              key={key}
            >
              <span class="flex items-center gap-2">
                <strong class="min-w-0 truncate font-mono text-xs">{key}</strong>
                <span class={`ml-auto shrink-0 px-2 py-1 text-xs font-bold ${stateStyles[state]}`}>
                  {state}
                </span>
              </span>
              <span class="mt-2 block text-xs text-slate-500">
                Defined in{' '}
                {
                  props.workspace.environments.filter(
                    (environment) => key in parseEnvironment(environment).values,
                  ).length
                }{' '}
                of {props.workspace.environments.length} environments
              </span>
            </button>
          )
        })}
      </div>
      {!keys.length && (
        <p class="p-8 text-center text-sm text-slate-500">
          No configuration keys match these filters.
        </p>
      )}
    </section>
  )
}
