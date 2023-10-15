// import { SystemCall } from '../../types';
import './style.scss';

// Create a script element and inject the attentionflow object into the webpage
const script = document.createElement('script');
script.textContent = `
    const EXTENSION_ID = "abbdlfdjkoideiedlmilklpfcojbbfnm";
    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth() + 1; // Months are zero-based
        const day = now.getUTCDate();
    
        return year + '-' + month + '-' + day;
    }

    window.attentionflow = {
        getAttentionRecord: async function(date = getCurrentDate()) {
            return new Promise((resolve) => {
                // document.addEventListener('DOMContentLoaded', () => {
                    chrome.runtime.sendMessage(EXTENSION_ID, { action: 'GetAttentionRecord', date }, (response) => {
                      resolve(response);
                    });
                // });
            });
          },
      };
  `;
(document.head || document.documentElement).appendChild(script);
script.remove();

window.namedssd = 'sda';
