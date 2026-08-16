import { OceanScene } from './scene/OceanScene'
import { TypingSpace } from './tools/TypingSpace'
import { BreathGuide } from './tools/BreathGuide'
import { ChordGarden } from './tools/ChordGarden'
import { useUIStore } from './store/useUIStore'
import { useOceanAmbience } from './audio/useOceanAmbience'
import './App.css'

function App() {
  useOceanAmbience()

  const activeTool = useUIStore((s) => s.activeTool)
  const setActiveTool = useUIStore((s) => s.setActiveTool)
  const audioStarted = useUIStore((s) => s.audioStarted)
  const audioMuted = useUIStore((s) => s.audioMuted)
  const volume = useUIStore((s) => s.volume)
  const startAudio = useUIStore((s) => s.startAudio)
  const toggleMute = useUIStore((s) => s.toggleMute)
  const setVolume = useUIStore((s) => s.setVolume)

  return (
    <div className="app-root">
      <div className="ocean-canvas-wrap">
        <OceanScene />
      </div>

      <div className="app-overlay">
        <div className="overlay-top">
          <div className="title-block">
            <div className="title">MINTAKA</div>
            <div className="subtitle">Clear Crystal Ocean</div>
          </div>
          <div className="top-controls">
            {audioStarted && (
              <div className="volume-control glass-panel">
                <button
                  type="button"
                  className="icon-button icon-button--plain"
                  onClick={toggleMute}
                  aria-label={audioMuted ? 'Unmute' : 'Mute'}
                >
                  {audioMuted ? '🔇' : '🔊'}
                </button>
                <input
                  type="range"
                  className="volume-slider"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label="Volume"
                />
              </div>
            )}
          </div>
        </div>

        <div className="tool-stage">
          {activeTool === 'typing' && <TypingSpace />}
          {activeTool === 'breath' && <BreathGuide />}
          {activeTool === 'chord' && <ChordGarden />}
        </div>

        <div className="overlay-bottom">
          <nav className="dock glass-panel">
            <button
              type="button"
              className={`dock-button ${activeTool === 'typing' ? 'active' : ''}`}
              onClick={() => setActiveTool('typing')}
            >
              <span className="label-full">Slow Typing Space</span>
            </button>
            <button
              type="button"
              className={`dock-button ${activeTool === 'breath' ? 'active' : ''}`}
              onClick={() => setActiveTool('breath')}
            >
              <span className="label-full">5-3-8 Breath Guide</span>
            </button>
            <button
              type="button"
              className={`dock-button ${activeTool === 'chord' ? 'active' : ''}`}
              onClick={() => setActiveTool('chord')}
            >
              <span className="label-full">Chord Garden</span>
            </button>
          </nav>
        </div>
      </div>

      {!audioStarted && (
        <div className="audio-hint">
          <div className="audio-hint-card glass-panel">
            <div className="title">Welcome to Mintaka</div>
            <p>
              Click to start the ocean ambience, and move your mouse across the water to feel
              the ripples. You can also browse muted.
            </p>
            <button type="button" onClick={startAudio}>
              Enter the Ocean
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
