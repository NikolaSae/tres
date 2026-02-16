// components/MarkdownViewer.tsx
'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
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
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const parseInline = (text: string): string => {
    let html = text;
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    return html;
  };

  const parseMarkdown = (md: string): React.ReactElement[] => {
    const lines = md.split('\n');
    const elements: React.ReactElement[] = [];
    let currentParagraph: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let tableLines: string[] = [];
    let inTable = false;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const content = currentParagraph.join(' ');
        elements.push(
          <p key={elements.length} dangerouslySetInnerHTML={{ __html: parseInline(content) }} />
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListTag = listType;
        elements.push(
          <ListTag key={elements.length}>
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
        inList = false;
      }
    };

    const flushTable = () => {
      if (tableLines.length >= 2) {
        // Filter out empty lines and separator lines
        const contentLines = tableLines.filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.match(/^\|[\s:-]+\|$/);
        });

        if (contentLines.length < 2) {
          tableLines = [];
          inTable = false;
          return;
        }

        const [header, ...rows] = contentLines;
        
        // Parse header
        const headerCells = header
          .split('|')
          .filter(cell => cell.trim())
          .map(cell => cell.trim());
        
        // Parse rows
        const bodyRows = rows.map(row => 
          row.split('|')
            .filter(cell => cell.trim())
            .map(cell => cell.trim())
        );
        
        // Only create table if we have valid data
        if (headerCells.length > 0 && bodyRows.length > 0) {
          elements.push(
            <table key={elements.length}>
              <thead>
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th key={idx} dangerouslySetInnerHTML={{ __html: parseInline(cell) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} dangerouslySetInnerHTML={{ __html: parseInline(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
      }
      tableLines = [];
      inTable = false;
    };

    lines.forEach((line, index) => {
      // Tables - detect table rows (must start and end with |)
      if (line.trim().match(/^\|.+\|$/)) {
        if (!inTable) {
          flushParagraph();
          flushList();
          inTable = true;
        }
        tableLines.push(line);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushParagraph();
          flushList();
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim() || 'text';
          codeContent = [];
        } else {
          const codeId = `code-${elements.length}`;
          const code = codeContent.join('\n');
          
          elements.push(
            <div key={elements.length} className="code-wrapper">
              <div className="code-header">
                <span className="code-lang">{codeLanguage}</span>
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(code, codeId)}
                  aria-label="Copy code"
                >
                  {copiedId === codeId ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="code-block">
                <code dangerouslySetInnerHTML={{ __html: escapeHtml(code) }} />
              </pre>
            </div>
          );
          
          inCodeBlock = false;
          codeLanguage = '';
          codeContent = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.match(/^#{1,6}\s/)) {
        flushParagraph();
        flushList();
        
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2];
          const id = generateId(text);
          const Tag = `h${level}` as React.ElementType;
          
          elements.push(
            <Tag key={elements.length} id={id}>
              {text}
            </Tag>
          );
        }
        return;
      }

      // Horizontal rules
      if (line.match(/^(---|\*\*\*)$/)) {
        flushParagraph();
        flushList();
        elements.push(<hr key={elements.length} />);
        return;
      }

      // Lists
      const ulMatch = line.match(/^[\-\*\+]\s+(.+)$/);
      const olMatch = line.match(/^\d+\.\s+(.+)$/);

      if (ulMatch || olMatch) {
        flushParagraph();
        
        const item = ulMatch ? ulMatch[1] : olMatch![1];
        const type = ulMatch ? 'ul' : 'ol';
        
        if (!inList || listType !== type) {
          flushList();
          inList = true;
          listType = type;
        }
        
        listItems.push(item);
        return;
      } else if (inList) {
        flushList();
      }

      // Blockquotes
      if (line.match(/^>\s+(.+)$/)) {
        flushParagraph();
        const match = line.match(/^>\s+(.+)$/);
        if (match) {
          elements.push(
            <blockquote key={elements.length} dangerouslySetInnerHTML={{ __html: parseInline(match[1]) }} />
          );
        }
        return;
      }

      // Empty lines
      if (line.trim() === '') {
        flushParagraph();
        flushList();
        return;
      }

      // Regular paragraphs (skip if looks like beginning of table)
      if (!line.trim().startsWith('|')) {
        currentParagraph.push(line);
      }
    });

    flushParagraph();
    flushList();
    flushTable();

    return elements;
  };

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
          margin-bottom: 1.5rem;
          padding-left: 0;
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
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .markdown-viewer .copy-btn:hover {
          background: #475569;
        }

        .markdown-viewer .code-block {
          margin: 0;
          padding: 1.25rem;
          overflow-x: auto;
          background: #1e293b;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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
          margin: 1.5rem 0;
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

        /* Dark mode */
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
      
      <div className="markdown-viewer">
        {parseMarkdown(content)}
      </div>
    </>
  );
}