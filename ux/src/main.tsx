import ReactDOM from 'react-dom/client'
import App from './App'
import 'maplibre-gl/dist/maplibre-gl.css'
import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'

// StrictMode intentionally omitted: its double-invoke of effects fights the
// imperative MapLibre lifecycle (map create/remove) and React-portal markers.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
