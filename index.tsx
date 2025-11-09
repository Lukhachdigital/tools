import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import App from './App';

// Add type definitions for the global window object to satisfy TypeScript.
declare global {
    interface Window {
        GoogleGenAI: typeof GoogleGenAI;
        GenAIType: typeof Type;
        GenAIModality: typeof Modality;
        // Fix: Add `google` to window to fix TypeScript errors when accessing Google Identity Services.
        
        // Fix: Removed the conflicting 'aistudio' property. It is assumed to be declared elsewhere globally.
    }
}

// Make GenAI classes available on the window for the components that expect it.
window.GoogleGenAI = GoogleGenAI;
window.GenAIType = Type;
window.GenAIModality = Modality;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  React.createElement(React.StrictMode, null, 
    React.createElement(App, null)
  )
);