import { useEffect, useState } from 'react'
import type { ApertureEfficiencyValue, BandwidthValue, PythonReply } from '../../shared/ipc'
import { useTranslation } from '../i18n/useTranslation'

type SupportedReply = PythonReply<BandwidthValue> | PythonReply<ApertureEfficiencyValue>

interface PythonVerifyButtonProps<Reply extends SupportedReply> {
  /** Numeric inputs to forward to the IPC call. Length must match the invoker arity. */
  inputs: number[]
  /** Bridge to the typed IPC method on `window.emApi`. */
  invoker: (...args: number[]) => Promise<Reply>
  /** TypeScript-side value used for the agreement check. */
  compareValue: number
  /** Lifts the comparable scalar out of the Python reply payload. */
  extractValue: (ok: Extract<Reply, { ok: true }>) => number
  /** Format the Python value for display. */
  formatValue: (value: number) => string
  /** Format the absolute delta between TS and Python for diagnostic display. */
  formatDelta: (delta: number) => string
  /** Agreement tolerance, absolute. Defaults to 1e-9. */
  tolerance?: number
}

type VerifyState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'match'; pythonValue: number; delta: number }
  | { kind: 'mismatch'; pythonValue: number; delta: number }
  | { kind: 'error'; message: string }
  | { kind: 'unavailable' }

export function PythonVerifyButton<Reply extends SupportedReply>(
  props: PythonVerifyButtonProps<Reply>,
): JSX.Element | null {
  const { t } = useTranslation()
  const [state, setState] = useState<VerifyState>({ kind: 'idle' })
  const [pythonAvailable, setPythonAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    const api = window.emApi
    if (!api) {
      setPythonAvailable(false)
      return
    }
    let cancelled = false
    void api.isPythonAvailable().then((avail) => {
      if (!cancelled) setPythonAvailable(avail)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (pythonAvailable === false) {
    // Production builds never ship Python. Render nothing so the UI stays clean;
    // dev builds without a working interpreter still show the inline hint.
    if (import.meta.env.PROD) return null
    return <p className="verify verify--unavailable">{t('verify.unavailable')}</p>
  }

  const onClick = async () => {
    setState({ kind: 'checking' })
    try {
      const reply = await props.invoker(...props.inputs)
      if (!reply.ok) {
        setState({ kind: 'error', message: reply.error })
        return
      }
      const pythonValue = props.extractValue(reply as Extract<Reply, { ok: true }>)
      const delta = Math.abs(pythonValue - props.compareValue)
      const tolerance = props.tolerance ?? 1e-9
      setState(
        delta <= tolerance
          ? { kind: 'match', pythonValue, delta }
          : { kind: 'mismatch', pythonValue, delta },
      )
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="verify">
      <button
        type="button"
        className="btn btn--ghost btn--with-spinner"
        onClick={onClick}
        disabled={state.kind === 'checking' || pythonAvailable === null}
      >
        {state.kind === 'checking' && <span aria-hidden="true" className="spinner" />}
        {state.kind === 'checking' ? t('verify.checking') : t('verify.button')}
      </button>
      {state.kind === 'match' && (
        <span className="verify__badge verify__badge--ok" role="status">
          ✓ {t('verify.match')} · Δ = {props.formatDelta(state.delta)}
        </span>
      )}
      {state.kind === 'mismatch' && (
        <span className="verify__badge verify__badge--err" role="status">
          ✗ {t('verify.mismatch')} · Python = {props.formatValue(state.pythonValue)} · Δ ={' '}
          {props.formatDelta(state.delta)}
        </span>
      )}
      {state.kind === 'error' && (
        <span className="verify__badge verify__badge--err" role="alert">
          ✗ {t('verify.error')}: {state.message}
        </span>
      )}
    </div>
  )
}
