import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';
import rehypeSlug from 'rehype-slug';
import remarkToc from 'remark-toc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './MarkdownRenderer.module.css';

/**
 * KaTeX CSS component to load KaTeX styles from CDN
 */
const KatexCSSLink = () => (
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
    integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
    crossOrigin="anonymous"
  />
);

/**
 * Check if a code block likely contains an ASCII table
 * @param {string} content - The content of the code block
 * @returns {boolean} - Whether the content appears to be an ASCII table
 */
const isAsciiTable = (content) => {
  if (!content) return false;
  
  const lines = content.split('\n');
  if (lines.length < 3) return false; // Need at least header, separator, and one data row
  
  // Check for common ASCII table patterns
  const hasTableBorders = content.includes('+-') && content.includes('-+');
  const hasTableRows = content.includes('| ') && content.includes(' |');
  const hasTableGridPattern = /\+[-+]+\+/.test(content); // Pattern like +----+----+
  
  // Check if at least 2 lines have pipe characters
  const linesWithPipes = lines.filter(line => line.includes('|')).length;
  
  return (hasTableBorders && hasTableRows) || 
         (hasTableGridPattern) || 
         (hasTableRows && linesWithPipes >= 2);
};

/**
 * Code Block component with copy functionality
 */
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  
  // Use the same hook for dark mode detection for consistency
  const prefersDarkMode = usePrefersDarkMode();
  const highlighterTheme = prefersDarkMode ? vscDarkPlus : vs;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Calculate number of lines for line number width adjustment
  const lineCount = value.split('\n').length;
  const lineNumberWidth = lineCount > 999 ? '3.5em' : lineCount > 99 ? '3em' : '2.5em';

  // Format language display name
  const displayLanguage = language ? language.toUpperCase() : 'TEXT';
  
  // Calculate if code has long lines that might need scrolling
  const hasLongLine = value.split('\n').some(line => line.length > 80);

  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeLanguage}>{displayLanguage}</span>
        <button 
          onClick={copyToClipboard} 
          className={`${styles.copyButton} ${copied ? styles.copySuccess : ''}`}
          aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div className={styles.codeBlockContent}>
        <SyntaxHighlighter
          style={highlighterTheme}
          language={language || 'text'}
          showLineNumbers={true}
          wrapLongLines={false}
          lineNumberStyle={{
            minWidth: lineNumberWidth,
            paddingRight: '0.7em',
            marginRight: '0.7em',
            textAlign: 'right',
            color: 'rgba(127, 127, 127, 0.5)',
            borderRight: '1px solid rgba(127, 127, 127, 0.2)',
            userSelect: 'none',
            position: 'sticky',
            left: 0,
            backgroundColor: 'var(--markdown-pre-bg)'
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '1rem',
            backgroundColor: 'var(--markdown-pre-bg)',
            color: 'var(--markdown-code-text)',
            borderRadius: 0,
            overflow: 'auto'
          }}
          codeTagProps={{
            style: {
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', monospace",
              fontSize: '1rem',
              lineHeight: 1.5
            }
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
      {hasLongLine && (
        <div 
          style={{ 
            fontSize: '0.75rem', 
            padding: '0.2rem 0.5rem', 
            textAlign: 'right',
            color: 'rgba(127, 127, 127, 0.7)',
            backgroundColor: 'var(--markdown-table-header-bg)',
            borderTop: '1px solid var(--markdown-table-border)'
          }}
        >
          Scroll horizontally to view more →
        </div>
      )}
    </div>
  );
};

/**
 * Detect if the user prefers dark mode
 * @returns {boolean} Whether the user prefers dark mode
 */
const usePrefersDarkMode = () => {
  const [prefersDarkMode, setPrefersDarkMode] = React.useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setPrefersDarkMode(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersDarkMode;
};

/**
 * MarkdownRenderer - A component to render markdown with advanced features
 * 
 * Features:
 * - Standard markdown syntax
 * - GitHub Flavored Markdown (tables, strikethrough, task lists)
 * - Syntax highlighting for code blocks
 * - Math equations with KaTeX
 * - ASCII diagrams and tables
 * - Table of contents generation
 * - HTML support
 * - Footnotes
 * - Auto-linked headers with custom IDs
 * - Consistent left alignment of text
 * - Responsive design with optimal reading width
 * - Proper text wrapping for all elements
 * 
 * @param {Object} props - Component props
 * @param {string} props.markdown - Markdown content to render
 * @param {string} props.className - Optional CSS class to apply to container
 * @param {string} props.tocHeading - Optional custom heading for Table of Contents (default: "Table of Contents")
 * @param {Object} props.syntaxHighlighterTheme - Optional theme for syntax highlighting
 * @param {boolean} props.allowHtml - Optional flag to enable/disable HTML rendering (enabled by default)
 * @param {boolean} props.optimizeForPrint - Optional flag to optimize for printing (false by default)
 * @param {boolean} props.skipFirstHeading - Optional flag to skip rendering the first h1 heading (false by default)
 */
const MarkdownRenderer = ({
  markdown,
  className = '',
  tocHeading = "Table of Contents",
  syntaxHighlighterTheme = null, // We'll determine this based on dark mode
  allowHtml = true,
  optimizeForPrint = false,
  skipFirstHeading = false,
}) => {
  // Use a ref to track if we've seen the first H1 heading
  // This avoids state updates during render
  const firstH1Ref = useRef(false);
  
  // Detect user's dark mode preference
  const prefersDarkMode = usePrefersDarkMode();
  
  // Choose appropriate syntax highlighting theme based on dark mode preference
  const highlighterTheme = syntaxHighlighterTheme || (prefersDarkMode ? vscDarkPlus : vs);
  
  // Reset the first heading tracker when markdown changes
  useEffect(() => {
    firstH1Ref.current = false;
  }, [markdown]);
  
  // Determine which rehype plugins to use based on allowHtml prop
  const rehypePlugins = [
    rehypeKatex,
    rehypeSlug,
  ];
  
  // Only include rehypeRaw if HTML is allowed
  if (allowHtml) {
    rehypePlugins.push(rehypeRaw);
  }
  
  // Apply global styles to enforce text alignment and proper wrapping
  const wrapperStyle = {
    position: 'relative',
    width: '100%',
    paddingRight: '20px', // Substantial padding to ensure no clipping
    boxSizing: 'border-box',
    overflowX: 'hidden',
    backgroundColor: 'transparent', // Ensure wrapper is transparent
  };
  
  const containerStyle = {
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%', 
    overflowWrap: 'break-word',
    wordWrap: 'break-word', // For older browsers
    wordBreak: 'normal',    // Default to normal word breaking
    hyphens: 'auto',        // Enable automatic hyphenation
    overflowX: 'hidden',    // Prevent horizontal scrolling
    paddingRight: '10px',   // Add padding to prevent text clipping
    boxSizing: 'border-box', // Ensure padding doesn't add to width
    backgroundColor: 'transparent', // Ensure container is transparent
  };
  
  const commonTextStyle = {
    textAlign: 'left',
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    maxWidth: '100%',
    paddingRight: '5px',    // Increased padding to prevent character clipping
    boxSizing: 'border-box',
    letterSpacing: '0.01em' // Slight letter spacing to prevent characters touching
  };
  
  const linkStyle = {
    ...commonTextStyle,
    display: 'inline',  // Changed from inline-block for better wrapping
    wordBreak: 'break-word',
    paddingRight: '0.3em', // Additional padding for links
    letterSpacing: '0.015em' // Increased letter spacing for better rendering
  };
  
  const codeStyle = {
    ...commonTextStyle,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all', // Allow breaking at any point if needed
    paddingRight: '0.4em',  // Extra padding for code elements
    letterSpacing: '0.02em', // Extra letter spacing for code
    textRendering: 'optimizeLegibility'
  };
  
  return (
    <>
      <KatexCSSLink />
      <div style={wrapperStyle}>
        <div 
          className={`${styles.markdownContainer} ${className} ${optimizeForPrint ? 'print-optimized' : ''}`} 
          style={containerStyle}
        >
          <ReactMarkdown
            remarkPlugins={[
              remarkGfm,
              remarkMath,
              remarkDirective,
              [remarkToc, { heading: tocHeading }]
            ]}
            rehypePlugins={rehypePlugins}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                const codeContent = String(children).replace(/\n$/, '');
                
                // Detect and handle ASCII tables specially
                if (!inline && isAsciiTable(codeContent)) {
                  return (
                    <div>
                      <span className={styles.asciiTableHeader}>ASCII Table</span>
                      <pre className={styles.asciiTable}>
                        {codeContent}
                      </pre>
                    </div>
                  );
                }
                
                // For other code blocks, use our enhanced CodeBlock component
                return !inline && match ? (
                  <CodeBlock
                    language={match[1]}
                    value={codeContent}
                  />
                ) : (
                  <code className={className} style={inline ? codeStyle : commonTextStyle} {...props}>
                    {children}
                  </code>
                )
              },
              p: ({node, children, ...props}) => (
                <p style={commonTextStyle} {...props}>{children}</p>
              ),
              h1: ({node, children, ...props}) => {
                // Skip first h1 heading if specified
                if (skipFirstHeading && !firstH1Ref.current) {
                  firstH1Ref.current = true; // Update the ref, not state
                  return null; // Don't render this heading
                }
                return <h1 style={commonTextStyle} {...props}>{children}</h1>
              },
              h2: ({node, children, ...props}) => (
                <h2 style={commonTextStyle} {...props}>{children}</h2>
              ),
              h3: ({node, children, ...props}) => (
                <h3 style={commonTextStyle} {...props}>{children}</h3>
              ),
              li: ({node, children, ...props}) => (
                <li style={commonTextStyle} {...props}>{children}</li>
              ),
              ul: ({node, children, ...props}) => (
                <ul style={{...commonTextStyle, paddingRight: '15px'}} {...props}>{children}</ul>
              ),
              ol: ({node, children, ...props}) => (
                <ol style={{...commonTextStyle, paddingRight: '15px'}} {...props}>{children}</ol>
              ),
              a: ({node, children, ...props}) => (
                <a style={linkStyle} {...props}>{children}</a>
              ),
              strong: ({node, children, ...props}) => (
                <strong style={{...commonTextStyle, letterSpacing: '0.01em'}} {...props}>{children}</strong>
              ),
              em: ({node, children, ...props}) => (
                <em style={{...commonTextStyle, letterSpacing: '0.01em'}} {...props}>{children}</em>
              ),
              table: ({node, children, ...props}) => (
                <div style={{overflowX: 'auto', maxWidth: '100%', paddingRight: '15px'}}>
                  <table style={{...commonTextStyle, tableLayout: 'fixed', width: '100%'}} {...props}>{children}</table>
                </div>
              ),
              td: ({node, children, ...props}) => (
                <td style={{...commonTextStyle, wordBreak: 'break-word', paddingRight: '8px'}} {...props}>{children}</td>
              ),
              th: ({node, children, ...props}) => (
                <th style={{...commonTextStyle, wordBreak: 'break-word', paddingRight: '8px'}} {...props}>{children}</th>
              ),
              blockquote: ({node, children, ...props}) => (
                <blockquote style={{...commonTextStyle, paddingRight: '10px'}} {...props}>{children}</blockquote>
              ),
              pre: ({node, children, ...props}) => (
                <pre style={{
                  textAlign: 'left', 
                  maxWidth: '100%', 
                  overflowX: 'auto', 
                  wordWrap: 'break-word', 
                  whiteSpace: 'pre-wrap',
                  paddingRight: '15px'
                }} {...props}>{children}</pre>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
};

export default MarkdownRenderer; 