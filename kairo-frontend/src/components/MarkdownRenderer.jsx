import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--sys-border)', margin: '12px 0' }}>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', margin: 0, fontSize: '13px', fontFamily: 'var(--sys-font-mono)' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className} style={{ fontFamily: 'var(--sys-font-mono)', padding: '2px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} {...props}>
        {children}
      </code>
    );
  }
};

export function MarkdownRenderer({ children }) {
  return <ReactMarkdown components={MarkdownComponents}>{children}</ReactMarkdown>;
}