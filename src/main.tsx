import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installPreviewFonts, loadFonts } from './design/fonts'
import { defaultDesign } from './state/presets'
import './styles/app.css'

installPreviewFonts()

const root = createRoot(document.getElementById('root')!)

// Title fitting measures text, so wait for the default fonts before the first render.
// Other fonts load on demand; App re-renders when they arrive.
const d = defaultDesign()
loadFonts([d.titleFont, d.bodyFont])
  .catch(() => undefined)
  .then(() =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
