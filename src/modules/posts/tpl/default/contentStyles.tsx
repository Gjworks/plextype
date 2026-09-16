export default function PostContentStyles() {
  return (
        <style dangerouslySetInnerHTML={{ __html: `
      .plextype-shiki-block {
        display: block !important;
        background-color: #f9fafb  !important;
        border-radius: 16px;
        margin: 2.5rem 0;
        padding: 1.5rem 2rem !important; 
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 14px !important;
        line-height: 1.8 !important;
        overflow-x: auto !important;
        scrollbar-width: none;
        white-space: pre !important;
      }

      .plextype-shiki-block code {
        background: none !important;
        padding: 0 !important;
        color: inherit !important;
        font-family: inherit !important;
        font-size: inherit !important;
        line-height: inherit !important;
        white-space: inherit !important;
      }

      .plextype-shiki-block::-webkit-scrollbar {
        display: none;
      }

      .dark .postContent .plextype-shiki-block {
        background-color: #232327 !important;
        color: var(--shiki-dark, #e4e4e7) !important;
      }

      .dark .postContent .plextype-shiki-block span {
        color: var(--shiki-dark, inherit) !important;
      }

      .postContent :not(pre) > code:not(.plextype-shiki-block code) {
        background-color: #e8f0ef !important;
        color: #41786f !important;
        border-radius: 6px;
        padding: 0.15em 0.4em;
      }

      .dark .postContent :not(pre) > code:not(.plextype-shiki-block code) {
        background-color: #183b39 !important;
        color: #7ee0d1 !important;
        box-shadow: inset 0 0 0 1px rgb(126 224 209 / 12%);
      }

      .postContent :not(pre) > code::before,
      .postContent :not(pre) > code::after {
        content: none;
      }
    `}} />
  );
}
