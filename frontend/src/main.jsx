import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext' 
import { ThemeProvider } from "./context/ThemeContext";
import { ClerkProvider } from '@clerk/clerk-react'

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

// Check if Clerk key is valid (starts with pk_)
const isValidClerkKey = CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_')

const AppContent = () => (
  <UserProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </UserProvider>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {isValidClerkKey ? (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <AppContent />
        </ClerkProvider>
      ) : (
        <>
          <AppContent />
          {console.warn('⚠️ Clerk is disabled - No valid VITE_CLERK_PUBLISHABLE_KEY found. Authentication features will not work.')}
        </>
      )}
    </BrowserRouter>
  </React.StrictMode>,
)

