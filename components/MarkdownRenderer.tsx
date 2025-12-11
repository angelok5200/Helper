import React from 'react';

// A lightweight custom renderer to avoid heavy dependencies in this environment
// Handles basic markdown: **bold**, code blocks, newlines, lists
interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-body text-sm md:text-base leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // It's a code block
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          const codeContent = match ? match[2] : part.slice(3, -3);
          const lang = match ? match[1] : '';
          return (
            <pre key={index} className="my-4 overflow-x-auto bg-slate-900 p-4 rounded-lg border border-slate-800">
              <code className={`language-${lang}`}>{codeContent}</code>
            </pre>
          );
        }

        // It's regular text, process inline formatting
        return (
            <div key={index} dangerouslySetInnerHTML={{ __html: parseInline(part) }} />
        );
      })}
    </div>
  );
};

// Basic inline parser
const parseInline = (text: string): string => {
  let html = text
    // Escape HTML first to prevent XSS (basic)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Unordered Lists (simple implementation)
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
     // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Newlines to br, but respect paragraph spacing slightly
    .replace(/\n/g, '<br />');

  return html;
};

export default MarkdownRenderer;