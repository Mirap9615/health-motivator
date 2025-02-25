import React from 'react'
import ReactDOM from 'react-dom/client'
import Router from './Router.jsx'
import { MantineProvider } from '@mantine/core';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <Router />
    </MantineProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
