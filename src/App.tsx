import { OceanScene } from './scene/OceanScene'
import { TypingSpace } from './tools/TypingSpace'
import { BreathGuide } from './tools/BreathGuide'
import { useUIStore } from './store/useUIStore'
import { useOceanAmbience } from './audio/useOceanAmbience'
import './App.css'

function App() {
  useOceanAmbience()

  const activeTool = useUIStore((s) => s.activeTool)
  const setActiveTool = useUIStore((s) => s.setActiveTool)
  const audioStarted = useUIStore((s) => s.audioStarted)
  const audioMuted = useUIStore((s) => s.audioMuted)
  const startAudio = useUIStore((s) => s.startAudio)
  const toggleMute = useUIStore((s) => s.toggleMute)

  return (
    <div className="app-root">
      <div className="ocean-canvas-wrap">
        <OceanScene />
      </div>

      <div className="app-overlay">
        <div className="overlay-top">
          <div className="title-block">
            <div className="title">MINTAKA</div>
            <div className="subtitle">参宿三 · 清澈水晶海洋</div>
          </div>
          <div className="top-controls">
            {audioStarted && (
              <button
                type="button"
                className="icon-button"
                onClick={toggleMute}
                aria-label={audioMuted ? '取消靜音' : '靜音'}
              >
                {audioMuted ? '🔇' : '🔊'}
              </button>
            )}
          </div>
        </div>

        <div className="tool-stage">
          {activeTool === 'typing' && <TypingSpace />}
          {activeTool === 'breath' && <BreathGuide />}
        </div>

        <div className="overlay-bottom">
          <nav className="dock glass-panel">
            <button
              type="button"
              className={`dock-button ${activeTool === 'typing' ? 'active' : ''}`}
              onClick={() => setActiveTool('typing')}
            >
              <span className="label-full">慢速打字空間</span>
            </button>
            <button
              type="button"
              className={`dock-button ${activeTool === 'breath' ? 'active' : ''}`}
              onClick={() => setActiveTool('breath')}
            >
              <span className="label-full">5-3-8 呼吸引導</span>
            </button>
          </nav>
        </div>
      </div>

      {!audioStarted && (
        <div className="audio-hint">
          <div className="audio-hint-card glass-panel">
            <div className="title">歡迎來到 Mintaka</div>
            <p>點擊開啟海洋環境音,並在畫面上移動滑鼠感受漣漪。也可以先靜音瀏覽。</p>
            <button type="button" onClick={startAudio}>
              進入海洋
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
