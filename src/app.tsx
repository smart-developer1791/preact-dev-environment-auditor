import { useSignal } from '@preact/signals'
import { Download, FileCheck2, KeyRound, RefreshCw, ScanSearch, ShieldAlert } from 'lucide-preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { EnvironmentMatrix } from './components/environment-matrix'
import { ImportPanel } from './components/import-panel'
import { KeyInspector } from './components/key-inspector'
import { WorkspaceState } from './components/workspace-state'
import {
  auditStats,
  environmentKeys,
  environmentWorkspaceSchema,
  keyState,
  parseEnvironment,
  updateEnvironmentValue,
  type EnvironmentWorkspace,
} from './domain/environment'
import { loadWorkspace, resetWorkspace, saveWorkspace } from './services/environment-store'

const storageKey = 'dev-environment-auditor-v1'

export function App() {
  const noticeTimer = useRef<number | undefined>(undefined)
  const query = useSignal('')
  const filter = useSignal('All')
  const [workspace, setWorkspace] = useState<EnvironmentWorkspace | null>(null)
  const [selectedKey, setSelectedKey] = useState('')
  const [reveal, setReveal] = useState(false)
  const [view, setView] = useState<'audit' | 'imports'>('audit')
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void loadWorkspace(storageKey)
      .then((data) => {
        setWorkspace(data)
        setSelectedKey(environmentKeys(data)[0] ?? '')
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Unexpected workspace error.')
      })
  }, [])
  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  function notify(message: string, error = false) {
    window.clearTimeout(noticeTimer.current)
    setNotice({ text: message, error })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2300)
  }

  async function updateWorkspace(next: EnvironmentWorkspace) {
    try {
      const parsed = environmentWorkspaceSchema.parse(next)
      setWorkspace(parsed)
      await saveWorkspace(storageKey, parsed)
      return true
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the environment files.', true)
      return false
    }
  }

  async function importFile(environmentName: string, file: File) {
    if (!workspace) return
    try {
      const content = await file.text()
      const next = {
        ...workspace,
        environments: workspace.environments.map((environment) =>
          environment.name === environmentName
            ? { ...environment, fileName: file.name, content }
            : environment,
        ),
      }
      if (!(await updateWorkspace(next))) return
      if (!environmentKeys(next).includes(selectedKey)) {
        setSelectedKey(environmentKeys(next)[0] ?? '')
      }
      notify(`${file.name} loaded into ${environmentName}.`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not import the environment file.',
        true,
      )
    }
  }

  function updateValue(environmentName: string, value: string) {
    if (!workspace) return
    try {
      const next = {
        ...workspace,
        environments: workspace.environments.map((environment) =>
          environment.name === environmentName
            ? updateEnvironmentValue(environment, selectedKey, value)
            : environment,
        ),
      }
      void updateWorkspace(next)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update the value.', true)
    }
  }

  function downloadReport() {
    if (!workspace) return
    const report = {
      generatedAt: new Date().toISOString(),
      summary: auditStats(workspace),
      environments: workspace.environments.map((environment) => ({
        name: environment.name,
        fileName: environment.fileName,
        keyCount: Object.keys(parseEnvironment(environment).values).length,
      })),
      keys: environmentKeys(workspace).map((key) => ({ key, state: keyState(key, workspace) })),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'environment-audit-report.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    notify('Redacted audit report exported.')
  }

  if (!workspace) {
    return <WorkspaceState label="Loading environment files..." error={loadError} />
  }

  const stats = auditStats(workspace)

  return (
    <main class="min-h-screen bg-slate-100 text-slate-900">
      <header class="border-b border-slate-800 bg-[#192831] text-white">
        <div class="mx-auto flex min-h-16 max-w-[1800px] items-center gap-3 px-4 sm:px-6">
          <span class="grid size-10 place-items-center bg-sky-300 text-[#192831]">
            <ScanSearch size={21} />
          </span>
          <div>
            <strong class="block text-sm">Env Sentry</strong>
            <span class="block text-xs text-sky-100/70">Environment auditor</span>
          </div>
          <span class="ml-auto hidden text-xs text-slate-300 md:block">
            Local parsing · values stay private
          </span>
          <button
            class="grid size-10 place-items-center border border-white/15 hover:bg-white/5 max-md:ml-auto"
            type="button"
            onClick={() =>
              void resetWorkspace(storageKey)
                .then((data) => {
                  setWorkspace(data)
                  setSelectedKey(environmentKeys(data)[0] ?? '')
                  setReveal(false)
                  setView('audit')
                  query.value = ''
                  filter.value = 'All'
                  notify('Sample environments restored.')
                })
                .catch((error: unknown) =>
                  notify(
                    error instanceof Error ? error.message : 'Could not restore the samples.',
                    true,
                  ),
                )
            }
            aria-label="Restore sample environments"
            title="Restore sample environments"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      <section class="border-b border-slate-200 bg-white">
        <div class="mx-auto max-w-[1800px] px-4 py-5 sm:px-6">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="text-xs font-bold text-sky-700">CONFIGURATION PARITY</p>
              <h1 class="mt-1 text-2xl font-bold sm:text-3xl">
                Compare environments without exposing secrets
              </h1>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Find missing keys, value drift, and likely typos across development, staging, and
                production-shaped files.
              </p>
            </div>
            <button
              class="inline-flex h-11 items-center gap-2 border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50"
              type="button"
              onClick={downloadReport}
            >
              <Download size={17} /> Export report
            </button>
          </div>
          <div class="mt-5 grid grid-cols-2 border border-slate-200 bg-slate-50 lg:grid-cols-4">
            {[
              { Icon: FileCheck2, value: stats.keys, label: 'Unique keys' },
              { Icon: ShieldAlert, value: stats.missing, label: 'Missing keys' },
              { Icon: ScanSearch, value: stats.different, label: 'Value differences' },
              { Icon: KeyRound, value: stats.secrets, label: 'Secret keys' },
            ].map(({ Icon, value, label }) => (
              <div
                class="flex min-h-20 items-center gap-3 border-r border-b border-slate-200 px-4 lg:border-b-0"
                key={label}
              >
                <Icon class="text-sky-700" size={18} />
                <span>
                  <strong class="block text-xl">{value}</strong>
                  <span class="text-xs text-slate-500">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav class="border-b border-slate-200 bg-white" aria-label="Environment auditor views">
        <div class="mx-auto flex max-w-[1800px] px-2 sm:px-5">
          <button
            class={`min-h-12 border-b-2 px-4 text-sm font-bold ${view === 'audit' ? 'border-sky-700 text-sky-800' : 'border-transparent text-slate-500'}`}
            type="button"
            onClick={() => setView('audit')}
          >
            Comparison
          </button>
          <button
            class={`min-h-12 border-b-2 px-4 text-sm font-bold ${view === 'imports' ? 'border-sky-700 text-sky-800' : 'border-transparent text-slate-500'}`}
            type="button"
            onClick={() => setView('imports')}
          >
            Files &amp; diagnostics
          </button>
        </div>
      </nav>

      {view === 'audit' ? (
        <div class="mx-auto grid max-w-[1800px] grid-cols-[minmax(0,1fr)] items-start gap-4 p-0 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <EnvironmentMatrix
            workspace={workspace}
            selectedKey={selectedKey}
            query={query.value}
            filter={filter.value}
            reveal={reveal}
            onQuery={(value) => (query.value = value)}
            onFilter={(value) => (filter.value = value)}
            onSelect={setSelectedKey}
          />
          {selectedKey ? (
            <KeyInspector
              workspace={workspace}
              selectedKey={selectedKey}
              reveal={reveal}
              onReveal={() => setReveal((value) => !value)}
              onValue={updateValue}
            />
          ) : (
            <aside class="border-y border-slate-200 bg-white p-6 text-center sm:border">
              <h2 class="font-bold">No keys to inspect</h2>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Import an environment file containing at least one key to begin comparison.
              </p>
            </aside>
          )}
        </div>
      ) : (
        <div class="mx-auto max-w-[1300px] p-0 sm:p-6">
          <ImportPanel
            workspace={workspace}
            onImport={(environment, file) => void importFile(environment, file)}
          />
        </div>
      )}

      {notice && (
        <div
          class={`fixed right-4 bottom-4 z-50 max-w-sm border bg-white px-4 py-3 text-sm font-bold shadow-xl ${notice.error ? 'border-red-200 text-red-800' : 'border-sky-200 text-sky-800'}`}
          role={notice.error ? 'alert' : 'status'}
        >
          {notice.text}
        </div>
      )}
    </main>
  )
}
