import { useEffect, useRef, useState } from 'react'
import type { ProfileId } from '../types'
import { PROFILES } from '../types'
import {
  PARENTS,
  PARENT_ORDER,
  PARENT_PHRASES,
} from '../lib/phrases'
import type { Parent, PhraseSpec } from '../lib/phrases'
import {
  deleteVoice,
  loadVoices,
  saveVoice,
  voiceKey,
} from '../lib/storage'
import { pickRecorderMimeType, playClip } from '../lib/audio'

interface Props {
  onBack: () => void
}

interface RecordingTarget {
  parent: Parent
  profileId: ProfileId
  phrase: PhraseSpec
}

export function ParentSettings({ onBack }: Props) {
  const [parent, setParent] = useState<Parent | null>(null)
  const [voices, setVoices] = useState(() => loadVoices())
  const [recording, setRecording] = useState<RecordingTarget | null>(null)

  const refresh = () => setVoices(loadVoices())

  if (recording) {
    return (
      <RecordingScreen
        target={recording}
        onCancel={() => setRecording(null)}
        onSave={(audioBase64) => {
          saveVoice(
            voiceKey(
              recording.parent,
              recording.profileId,
              recording.phrase.index,
            ),
            audioBase64,
          )
          refresh()
          setRecording(null)
        }}
      />
    )
  }

  if (!parent) {
    return <PickParent onPick={setParent} onBack={onBack} />
  }

  return (
    <PhraseList
      parent={parent}
      voices={voices}
      onRecord={(profileId, phrase) =>
        setRecording({ parent, profileId, phrase })
      }
      onPlay={(audio) => {
        void playClip(audio)
      }}
      onDelete={(profileId, phrase) => {
        deleteVoice(voiceKey(parent, profileId, phrase.index))
        refresh()
      }}
      onSwitchParent={() => setParent(null)}
      onBack={onBack}
    />
  )
}

// ---------------------------------------------------------------------------

function PickParent({
  onPick,
  onBack,
}: {
  onPick: (p: Parent) => void
  onBack: () => void
}) {
  return (
    <main className="relative flex h-full w-full flex-col items-center gap-8 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 p-6 text-white">
      <header className="mt-8 max-w-md text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Настройка родителя
        </h1>
        <p className="mt-2 text-base text-slate-300">
          Запишите подбадривающие фразы — они будут проигрываться
          при старте игры и при переходе на новый уровень.
        </p>
      </header>

      <div className="flex w-full max-w-md flex-col gap-4">
        {PARENT_ORDER.map((id) => {
          const p = PARENTS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="flex h-24 w-full items-center justify-center gap-4 rounded-3xl bg-white/10 px-6 ring-1 ring-white/20 backdrop-blur transition active:scale-[0.97]"
            >
              <span className="text-5xl" aria-hidden="true">
                {p.emoji}
              </span>
              <span className="text-3xl font-extrabold">{p.displayName}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-auto rounded-full bg-black/30 px-6 py-3 text-base font-semibold backdrop-blur active:scale-95"
      >
        ← Назад
      </button>
    </main>
  )
}

// ---------------------------------------------------------------------------

function PhraseList({
  parent,
  voices,
  onRecord,
  onPlay,
  onDelete,
  onSwitchParent,
  onBack,
}: {
  parent: Parent
  voices: Record<string, string>
  onRecord: (profileId: ProfileId, phrase: PhraseSpec) => void
  onPlay: (audioBase64: string) => void
  onDelete: (profileId: ProfileId, phrase: PhraseSpec) => void
  onSwitchParent: () => void
  onBack: () => void
}) {
  const p = PARENTS[parent]
  return (
    <main className="relative flex h-full w-full flex-col gap-4 overflow-y-auto bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 p-5 text-white">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSwitchParent}
          aria-label="Сменить родителя"
          className="rounded-full bg-black/40 px-3 py-2 text-sm font-semibold backdrop-blur active:scale-95"
        >
          ← Сменить
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="mr-2" aria-hidden="true">
            {p.emoji}
          </span>
          {p.displayName}
        </h1>
        <button
          type="button"
          onClick={onBack}
          aria-label="На главный"
          className="rounded-full bg-black/40 px-3 py-2 text-sm font-semibold backdrop-blur active:scale-95"
        >
          На главный
        </button>
      </header>

      {(['atai', 'emily'] as ProfileId[]).map((profileId) => {
        const profile = PROFILES[profileId]
        return (
          <section
            key={profileId}
            className="flex flex-col gap-2 rounded-3xl bg-white/5 p-4 ring-1 ring-white/15"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span aria-hidden="true">{profile.emoji}</span>
              для {profile.displayName}
            </h2>
            <ul className="flex flex-col gap-2">
              {PARENT_PHRASES[profileId].map((phrase) => {
                const key = voiceKey(parent, profileId, phrase.index)
                const audio = voices[key] ?? null
                return (
                  <li
                    key={phrase.index}
                    className={`flex flex-col gap-2 rounded-2xl px-3 py-2 ring-1 ${
                      audio
                        ? 'bg-emerald-500/15 ring-emerald-400/30'
                        : 'bg-black/25 ring-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 ${audio ? 'text-emerald-300' : 'text-slate-400'}`}
                      >
                        {audio ? '✓' : '○'}
                      </span>
                      <span className="flex-1 text-base font-semibold leading-snug">
                        «{phrase.text}»
                        {phrase.isStart && (
                          <span className="ml-2 rounded-full bg-amber-400/30 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-100">
                            старт
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onRecord(profileId, phrase)}
                        className="rounded-full bg-rose-600/80 px-4 py-1.5 text-sm font-bold active:scale-95"
                      >
                        🎤 {audio ? 'Перезаписать' : 'Записать'}
                      </button>
                      {audio && (
                        <button
                          type="button"
                          onClick={() => onPlay(audio)}
                          className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur active:scale-95"
                        >
                          ▶ Прослушать
                        </button>
                      )}
                      {audio && (
                        <button
                          type="button"
                          onClick={() => onDelete(profileId, phrase)}
                          className="rounded-full bg-black/30 px-4 py-1.5 text-sm font-bold backdrop-blur active:scale-95"
                        >
                          🗑 Удалить
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </main>
  )
}

// ---------------------------------------------------------------------------

const MAX_DURATION_MS = 6000

function RecordingScreen({
  target,
  onCancel,
  onSave,
}: {
  target: RecordingTarget
  onCancel: () => void
  onSave: (audioBase64: string) => void
}) {
  const [stage, setStage] = useState<'idle' | 'recording' | 'preview' | 'error'>(
    'idle',
  )
  const [errorText, setErrorText] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [clip, setClip] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTsRef = useRef(0)
  const tickRef = useRef<number | null>(null)
  const stopGuardRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        try {
          recorderRef.current.stop()
        } catch {
          // ignore
        }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (tickRef.current !== null) window.clearInterval(tickRef.current)
      if (stopGuardRef.current !== null) window.clearTimeout(stopGuardRef.current)
    }
  }, [])

  const startRecording = async () => {
    setErrorText(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStage('error')
      setErrorText('Этот браузер не умеет записывать звук.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickRecorderMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        if (tickRef.current !== null) {
          window.clearInterval(tickRef.current)
          tickRef.current = null
        }
        if (stopGuardRef.current !== null) {
          window.clearTimeout(stopGuardRef.current)
          stopGuardRef.current = null
        }
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setClip(reader.result)
            setStage('preview')
          } else {
            setStage('error')
            setErrorText('Не получилось закодировать запись.')
          }
        }
        reader.onerror = () => {
          setStage('error')
          setErrorText('Не получилось закодировать запись.')
        }
        reader.readAsDataURL(blob)
      }

      recorder.start()
      startTsRef.current = performance.now()
      setDuration(0)
      tickRef.current = window.setInterval(() => {
        setDuration((performance.now() - startTsRef.current) / 1000)
      }, 100)
      stopGuardRef.current = window.setTimeout(() => {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      }, MAX_DURATION_MS)
      setStage('recording')
    } catch (err) {
      setStage('error')
      const msg =
        err instanceof Error
          ? err.message
          : 'Не удалось получить доступ к микрофону.'
      setErrorText(msg)
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  const playPreview = () => {
    if (clip) void playClip(clip)
  }

  const confirm = () => {
    if (clip) onSave(clip)
  }

  const profile = PROFILES[target.profileId]
  const parent = PARENTS[target.parent]

  return (
    <main className="relative flex h-full w-full flex-col items-center justify-between bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 p-6 text-white">
      <header className="text-center">
        <p className="text-xs uppercase tracking-widest text-slate-300">
          {parent.emoji} {parent.displayName} {'→'} {profile.emoji} {profile.displayName}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          «{target.phrase.text}»
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {parent.tone === 'тепло'
            ? 'Скажите тепло, как ребёнку перед сном.'
            : 'Скажите бодро, как тренер на финише.'}
        </p>
      </header>

      <div className="flex flex-col items-center gap-5">
        {stage === 'idle' && (
          <button
            type="button"
            onClick={startRecording}
            className="grid h-40 w-40 place-items-center rounded-full bg-rose-600 text-2xl font-extrabold shadow-2xl shadow-black/40 active:scale-95"
          >
            🎤
            <span className="text-base">Начать</span>
          </button>
        )}

        {stage === 'recording' && (
          <>
            <div className="kiks-bob text-7xl" aria-hidden="true">
              🔴
            </div>
            <p className="text-2xl font-extrabold tabular-nums">
              {duration.toFixed(1)} с
            </p>
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-full bg-white px-10 py-4 text-xl font-extrabold text-slate-900 shadow-xl active:scale-95"
            >
              ⏹ Остановить
            </button>
          </>
        )}

        {stage === 'preview' && clip && (
          <>
            <button
              type="button"
              onClick={playPreview}
              className="rounded-full bg-white/15 px-8 py-4 text-xl font-bold backdrop-blur active:scale-95"
            >
              ▶ Прослушать
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStage('idle')
                  setClip(null)
                }}
                className="rounded-full bg-black/30 px-6 py-3 text-base font-bold backdrop-blur active:scale-95"
              >
                ↻ Перезаписать
              </button>
              <button
                type="button"
                onClick={confirm}
                className="rounded-full bg-emerald-500 px-8 py-3 text-base font-extrabold text-slate-950 shadow-xl active:scale-95"
              >
                ✓ Сохранить
              </button>
            </div>
          </>
        )}

        {stage === 'error' && (
          <p className="max-w-xs rounded-2xl bg-rose-700/70 px-4 py-3 text-center text-sm font-semibold">
            {errorText ?? 'Что-то пошло не так.'}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="rounded-full bg-black/30 px-6 py-3 text-base font-semibold backdrop-blur active:scale-95"
      >
        ← Отмена
      </button>
    </main>
  )
}
