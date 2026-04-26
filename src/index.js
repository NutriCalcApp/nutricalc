import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

if (typeof navigator !== 'undefined' && navigator.locks) {
  const _orig = navigator.locks.request.bind(navigator.locks);
  navigator.locks.request = function(name, ...args) {
    if (name && name.startsWith('lock:')) {
      const fn = args[args.length - 1];
      if (typeof fn === 'function') return Promise.resolve(fn());
    }
    return _orig(name, ...args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
