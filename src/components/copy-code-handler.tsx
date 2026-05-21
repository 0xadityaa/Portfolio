"use client";

import { useEffect } from "react";

export function CopyCodeHandler() {
  useEffect(() => {
    const handleCopyClick = async (event: Event) => {
      const button = event.target as HTMLElement;
      const copyBtn = button.closest('.copy-btn');
      
      if (!copyBtn) return;
      
      const targetId = copyBtn.getAttribute('data-copy-target');
      if (!targetId) return;
      
      const pre = document.getElementById(targetId);
      if (!pre) return;
      
      const code = pre.querySelector('code');
      if (!code) return;
      
      const text = code.textContent || code.innerText || '';
      
      const copyIcon = copyBtn.querySelector('.copy-icon');
      const checkIcon = copyBtn.querySelector('.check-icon');
      
      try {
        await navigator.clipboard.writeText(text);
        
        if (copyIcon && checkIcon) {
          copyIcon.classList.add('hidden');
          checkIcon.classList.remove('hidden');
          
          setTimeout(() => {
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          if (copyIcon && checkIcon) {
            copyIcon.classList.add('hidden');
            checkIcon.classList.remove('hidden');
            
            setTimeout(() => {
              copyIcon.classList.remove('hidden');
              checkIcon.classList.add('hidden');
            }, 2000);
          }
        } catch (fallbackErr) {
          console.error('Fallback copy failed: ', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    };

    // Add event listeners to all copy buttons
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', handleCopyClick);
    });

    // Cleanup event listeners
    return () => {
      copyButtons.forEach(button => {
        button.removeEventListener('click', handleCopyClick);
      });
    };
  }, []);

  return null; // This component doesn't render anything
}