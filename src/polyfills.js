import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
  window.process = { env: {} };
  
  // Polyfill para crypto.getRandomValues
  if (!window.crypto) {
    window.crypto = {
      getRandomValues: function(buffer) {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
      }
    };
  }
}