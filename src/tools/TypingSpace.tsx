import { useEffect, useRef, useState } from 'react'
import { OCEAN_WORDS } from './typingWords'
import './TypingSpace.css'

const WORD_INTERVAL_MS = 20000

function pickWord(exclude?: string): string {
  let word = OCEAN_WORDS[Math.floor(Math.random() * OCEAN_WORDS.length)]
  if (exclude && OCEAN_WORDS.length > 1) {
    while (word === exclude) {
      word = OCEAN_WORDS[Math.floor(Math.random() * OCEAN_WORDS.length)]
    }
  }
  return word
}

export function TypingSpace() {
  const [word, setWord] = useState<string>(() => pickWord())
  const [fadeKey, setFadeKey] = useState(0)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      setWord((prev) => pickWord(prev))
      setFadeKey((k) => k + 1)
    }, WORD_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    textRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="typing-space glass-panel">
      <div className="typing-prompt" key={fadeKey}>
        <span className="prompt-en">{word}</span>
      </div>
      <textarea
        ref={textRef}
        className="typing-area"
        placeholder="Type freely here... following the word or not is entirely up to you"
        spellCheck={false}
      />
      <p className="typing-hint">
        A new ocean word drifts up roughly every 20 seconds, just for company — no score, no
        tracking.
      </p>
    </div>
  )
}
