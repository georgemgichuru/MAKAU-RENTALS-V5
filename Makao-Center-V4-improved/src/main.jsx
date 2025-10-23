import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ContextProvider from './context/AppContext.jsx'
import NotificationProvider from './context/NotificationContext.jsx'
import ToastProvider from './context/ToastContext.jsx'


createRoot(document.getElementById('root')).render(
    
          
    <ContextProvider>
        
         <NotificationProvider>
              <ToastProvider>
                        <StrictMode>
                            <App />
                    </StrictMode>
            </ToastProvider>
      
         </NotificationProvider>
   
    </ContextProvider>

)
