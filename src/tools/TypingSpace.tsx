import { useEffect, useRef, useState } from 'react'
import { OCEAN_WORDS, type OceanWord } from './typingWords'
import './TypingSpace.css'

const WORD_INTERVAL_MS = 20000

function pickWord(exclude?: string): OceanWord {
  let word = OCEAN_WORDS[Math.floor(Math.random() * OCEAN_WORDS.length)]
  if (exclude && OCEAN_WORDS.length > 1) {
    while (word.en === exclude) {
      word = OCEAN_WORDS[Math.floor(Math.random() * OCEAN_WORDS.length)]
    }
  }
  return word
}

export function TypingSpace() {
  const [word, setWord] = useState<OceanWord>(() => pickWord())
  const [fadeKey, setFadeKey] = useState(0)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      setWord((prev) => pickWord(prev.en))
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
        <span className="prompt-en">{word.en}</span>
        <span className="prompt-zh">{word.zh}</span>
      </div>
      <textarea
        ref={textRef}
        className="typing-area"
        placeholder="在這裡自由地打字⋯⋯跟著打,或者不跟著打都沒關係"
        spellCheck={false}
      />
      <p className="typing-hint">每隔約 20 秒會浮現一個新的海洋詞彙,單純作陪伴,不計分、不追蹤。</p>
    </div>
  )
}
