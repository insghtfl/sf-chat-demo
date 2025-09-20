"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import { useEffect } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Set page metadata
    document.title = "Snowflake Agent API Chatbot";
    
    // Add meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Snowflake Agent API Chatbot');
    
    // Add extension suppression styles on client side only
    const style = document.createElement('style');
    style.textContent = `
      /* Hide browser extension elements */
      [data-grammarly-shadow-root],
      [data-grammarly-ignore],
      .grammarly-extension,
      .grammarly-extension *,
      [id*="grammarly"],
      [class*="grammarly"],
      [data-new-gr-c-s-check-loaded],
      [data-gr-ext-installed],
      [cz-shortcut-listen] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* Prevent extension styles from affecting our app */
      body[data-new-gr-c-s-check-loaded],
      body[data-gr-ext-installed],
      body[cz-shortcut-listen] {
        all: unset !important;
        font-family: var(--font-geist-sans), var(--font-geist-mono), system-ui, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Cleanup on unmount
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script
          suppressHydrationWarning={true}
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress browser extension errors
              (function() {
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                
                // Override console methods
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('chrome-extension://') ||
                      message.includes('g2External.styles.css') ||
                      message.includes('viewBox') ||
                      message.includes('Grammarly') ||
                      message.includes('content.js') ||
                      message.includes('Failed to load resource')) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('chrome-extension://') ||
                      message.includes('g2External.styles.css') ||
                      message.includes('viewBox') ||
                      message.includes('Grammarly') ||
                      message.includes('content.js') ||
                      message.includes('Failed to load resource')) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
                
                console.log = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('chrome-extension://') ||
                      message.includes('g2External.styles.css') ||
                      message.includes('viewBox') ||
                      message.includes('Grammarly') ||
                      message.includes('content.js') ||
                      message.includes('Failed to load resource')) {
                    return;
                  }
                  originalLog.apply(console, args);
                };
                
                // Suppress global errors
                window.addEventListener('error', function(e) {
                  if (e.message && (
                    e.message.includes('chrome-extension://') ||
                    e.message.includes('moz-extension://') ||
                    e.message.includes('safari-extension://') ||
                    e.message.includes('g2External.styles.css') ||
                    e.message.includes('viewBox') ||
                    e.message.includes('Grammarly') ||
                    e.message.includes('content.js') ||
                    e.message.includes('Failed to load resource')
                  )) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                });
                
                // Suppress unhandled promise rejections
                window.addEventListener('unhandledrejection', function(e) {
                  const reason = e.reason ? e.reason.toString() : '';
                  if (reason.includes('chrome-extension://') ||
                      reason.includes('g2External.styles.css') ||
                      reason.includes('viewBox') ||
                      reason.includes('Grammarly') ||
                      reason.includes('content.js')) {
                    e.preventDefault();
                    return false;
                  }
                });
                
                // Suppress resource loading errors
                window.addEventListener('error', function(e) {
                  if (e.target && e.target !== window && 
                      (e.target.src && e.target.src.includes('chrome-extension://')) ||
                      (e.target.href && e.target.href.includes('chrome-extension://'))) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }, true);
                
                // Remove extension attributes from body
                function cleanBodyAttributes() {
                  const body = document.body;
                  if (body) {
                    const attributesToRemove = [
                      'data-new-gr-c-s-check-loaded',
                      'data-gr-ext-installed',
                      'cz-shortcut-listen'
                    ];
                    attributesToRemove.forEach(attr => {
                      if (body.hasAttribute(attr)) {
                        body.removeAttribute(attr);
                      }
                    });
                  }
                }
                
                // Clean attributes on DOM ready and periodically
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', cleanBodyAttributes);
                } else {
                  cleanBodyAttributes();
                }
                
                // Clean attributes periodically to prevent re-addition
                setInterval(cleanBodyAttributes, 1000);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
