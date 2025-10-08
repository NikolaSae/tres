//app/components/MarkdownViewer.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  };

  const generateId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const parseMarkdown = (md: string): string => {
    let html = md;

    // Fenced code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `code-${Math.random().toString(36).substr(2, 9)}`;
      const trimmedCode = code.trim();
      return `<div class="code-wrapper" data-lang="${lang || 'text'}">
        <div class="code-header">
          <span class="code-lang">${lang || 'text'}</span>
          <button class="copy-btn" data-code="${encodeURIComponent(trimmedCode)}" data-id="${id}">Copy</button>
        </div>
        <pre class="code-block"><code>${escapeHtml(trimmedCode)}</code></pre>
      </div>`;
    });

    // Headers with IDs for anchors
    html = html.replace(/^#{6}\s+(.+)$/gim, (match, text) => 
      `<h6 id="${generateId(text)}">${text}</h6>`
    );
    html = html.replace(/^#{5}\s+(.+)$/gim, (match, text) => 
      `<h5 id="${generateId(text)}">${text}</h5>`
    );
    html = html.replace(/^#{4}\s+(.+)$/gim, (match, text) => 
      `<h4 id="${generateId(text)}">${text}</h4>`
    );
    html = html.replace(/^###\s+(.+)$/gim, (match, text) => 
      `<h3 id="${generateId(text)}">${text}</h3>`
    );
    html = html.replace(/^##\s+(.+)$/gim, (match, text) => 
      `<h2 id="${generateId(text)}">${text}</h2>`
    );
    html = html.replace(/^#\s+(.+)$/gim, (match, text) => 
      `<h1 id="${generateId(text)}">${text}</h1>`
    );

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gim, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr />');
    html = html.replace(/^\*\*\*$/gim, '<hr />');

    // Unordered lists
    const ulRegex = /((?:^[\-\*\+]\s+.+$\n?)+)/gim;
    html = html.replace(ulRegex, (match) => {
      const items = match
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[\-\*\+]\s+/, ''))
        .map(item => `<li>${item}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists
    const olRegex = /((?:^\d+\.\s+.+$\n?)+)/gim;
    html = html.replace(olRegex, (match) => {
      const items = match
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s+/, ''))
        .map(item => `<li>${item}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    });

    // Tables
    const tableRegex = /(\|.+\|\n)+/g;
    html = html.replace(tableRegex, (match) => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) return match;
      
      const headers = rows[0].split('|').filter(cell => cell.trim());
      const separator = rows[1];
      const dataRows = rows.slice(2);
      
      let table = '<table><thead><tr>';
      headers.forEach(header => {
        table += `<th>${header.trim()}</th>`;
      });
      table += '</tr></thead><tbody>';
      
      dataRows.forEach(row => {
        const cells = row.split('|').filter(cell => cell.trim());
        table += '<tr>';
        cells.forEach(cell => {
          table += `<td>${cell.trim()}</td>`;
        });
        table += '</tr>';
      });
      
      table += '</tbody></table>';
      return table;
    });

    // Paragraphs
    const lines = html.split('\n');
    const processed: string[] = [];
    let inParagraph = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        if (inParagraph) {
          processed.push('</p>');
          inParagraph = false;
        }
        processed.push(line);
      } else if (line.match(/^<(h[1-6]|ul|ol|table|blockquote|hr|div|pre)/)) {
        if (inParagraph) {
          processed.push('</p>');
          inParagraph = false;
        }
        processed.push(line);
      } else {
        if (!inParagraph) {
          processed.push('<p>');
          inParagraph = true;
        }
        processed.push(line);
      }
    }
    
    if (inParagraph) {
      processed.push('</p>');
    }

    return processed.join('\n');
  };

  useEffect(() => {
    const handleCopyClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.copy-btn') as HTMLElement;
      
      if (button) {
        const code = decodeURIComponent(button.getAttribute('data-code') || '');
        const id = button.getAttribute('data-id') || '';
        copyToClipboard(code, id);
        
        if (copiedCode === id) {
          button.textContent = 'Copied!';
        }
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, [copiedCode]);

  return (
    <>
      <style jsx global>{`
        .markdown-viewer {
          line-height: 1.8;
          color: #1f2937;
        }

        .markdown-viewer h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1.5rem;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 0.75rem;
          color: #111827;
        }

        .markdown-viewer h2 {
          font-size: 2rem;
          font-weight: 600;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .markdown-viewer h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #374151;
        }

        .markdown-viewer h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: #4b5563;
        }

        .markdown-viewer p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .markdown-viewer ul, .markdown-viewer ol {
          margin-left: 2rem;
          margin-bottom: 1rem;
        }

        .markdown-viewer li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .markdown-viewer a {
          color: #3b82f6;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s;
        }

        .markdown-viewer a:hover {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .markdown-viewer code.inline-code {
          background: #f1f5f9;
          padding: 0.2rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875em;
          font-family: 'Monaco', 'Courier New', monospace;
          color: #dc2626;
          border: 1px solid #e2e8f0;
        }

        .markdown-viewer .code-wrapper {
          position: relative;
          background: #1e293b;
          border-radius: 0.5rem;
          overflow: hidden;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .markdown-viewer .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #0f172a;
          border-bottom: 1px solid #334155;
        }

        .markdown-viewer .code-lang {
          color: #94a3b8;
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .markdown-viewer .copy-btn {
          background: #334155;
          border: none;
          color: #e2e8f0;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .markdown-viewer .copy-btn:hover {
          background: #475569;
        }

        .markdown-viewer .code-block {
          margin: 0;
          padding: 1.25rem;
          overflow-x: auto;
          background: #1e293b;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.7;
        }

        .markdown-viewer .code-block code {
          color: #e2e8f0;
          background: transparent;
        }

        .markdown-viewer blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 0.375rem;
        }

        .markdown-viewer hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2.5rem 0;
        }

        .markdown-viewer table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .markdown-viewer th {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #1f2937;
        }

        .markdown-viewer td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          color: #374151;
        }

        .markdown-viewer tbody tr:hover {
          background: #f9fafb;
        }

        .dark .markdown-viewer {
          color: #e5e7eb;
        }

        .dark .markdown-viewer h1,
        .dark .markdown-viewer h2,
        .dark .markdown-viewer h3,
        .dark .markdown-viewer h4 {
          color: #f3f4f6;
        }

        .dark .markdown-viewer h1 {
          border-bottom-color: #3b82f6;
        }

        .dark .markdown-viewer h2 {
          border-bottom-color: #374151;
        }

        .dark .markdown-viewer code.inline-code {
          background: #374151;
          color: #fca5a5;
          border-color: #4b5563;
        }

        .dark .markdown-viewer blockquote {
          background: #1f2937;
          color: #9ca3af;
          border-left-color: #3b82f6;
        }

        .dark .markdown-viewer th {
          background: #374151;
          color: #f3f4f6;
          border-color: #4b5563;
        }

        .dark .markdown-viewer td {
          border-color: #4b5563;
          color: #d1d5db;
        }

        .dark .markdown-viewer tbody tr:hover {
          background: #1f2937;
        }
      `}</style>
      
      <div 
        className="markdown-viewer"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} 
      />
    </>
  );
}