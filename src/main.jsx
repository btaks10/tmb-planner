import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Redirect bare URLs to the last-used share token before App mounts
function TokenRedirect() {
  const { section } = useParams();
  const lastToken = localStorage.getItem('tmb-last-token');
  if (lastToken) {
    return <Navigate to={`/t/${lastToken}${section ? `/${section}` : ''}`} replace />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/t/:token/:section?" element={<App />} />
        <Route path="/:section" element={<TokenRedirect />} />
        <Route path="/" element={<TokenRedirect />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
