import { BookDoc } from '@/libs/document';
import { BookConfig } from '@/types/book';
import { useEffect, useRef, useState } from 'react';
import { useFoliateEvents } from '../hooks/useFoliateEvents';

interface FoliateViewerProps {
  bookId: string;
  bookConfig: BookConfig;
  bookDoc: BookDoc;
}

const getCSS = (spacing: number, justify: boolean, hyphenate: boolean) => `
    @namespace epub "http://www.idpf.org/2007/ops";
    html {
        color-scheme: light dark;
    }
    /* https://github.com/whatwg/html/issues/5426 */
    @media (prefers-color-scheme: dark) {
        a:link {
            color: lightblue;
        }
    }
    p, li, blockquote, dd {
        line-height: ${spacing};
        text-align: ${justify ? 'justify' : 'start'};
        -webkit-hyphens: ${hyphenate ? 'auto' : 'manual'};
        hyphens: ${hyphenate ? 'auto' : 'manual'};
        -webkit-hyphenate-limit-before: 3;
        -webkit-hyphenate-limit-after: 2;
        -webkit-hyphenate-limit-lines: 2;
        hanging-punctuation: allow-end last;
        widows: 2;
    }
    /* prevent the above from overriding the align attribute */
    [align="left"] { text-align: left; }
    [align="right"] { text-align: right; }
    [align="center"] { text-align: center; }
    [align="justify"] { text-align: justify; }

    pre {
        white-space: pre-wrap !important;
    }
    aside[epub|type~="endnote"],
    aside[epub|type~="footnote"],
    aside[epub|type~="note"],
    aside[epub|type~="rearnote"] {
        display: none;
    }
`;

export interface FoliateView extends HTMLElement {
  open: (book: BookDoc) => Promise<void>;
  init: (options: { lastLocation: string }) => void;
  goToFraction: (fraction: number) => void;
  renderer: {
    setStyles: (css: string) => void;
    next: () => Promise<void>;
    prev: () => Promise<void>;
  };
}

const FoliateViewer: React.FC<FoliateViewerProps> = ({ bookId, bookConfig, bookDoc }) => {
  const viewRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<FoliateView | null>(null);
  const isViewCreated = useRef(false);

  useEffect(() => {
    if (isViewCreated.current) return;
    const openBook = async () => {
      await import('foliate-js/view.js');
      const view = document.createElement('foliate-view') as FoliateView;
      document.body.append(view);
      viewRef.current?.appendChild(view);

      setView(view);
      await view.open(bookDoc);
      if ('setStyles' in view.renderer) {
        view.renderer.setStyles(getCSS(2.4, true, true)); //TODO
      }
      const lastLocation = bookConfig.location;
      if (lastLocation) {
        view.init({ lastLocation });
      } else {
        view.goToFraction(0);
      }
    };

    openBook();
    isViewCreated.current = true;
  }, [bookDoc]);

  useFoliateEvents(view, bookId);

  const handleTap = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { clientX } = event;
    const width = window.innerWidth;
    const leftThreshold = width * 0.5;
    const rightThreshold = width * 0.5;

    if (clientX < leftThreshold) {
      view?.renderer?.prev();
    } else if (clientX > rightThreshold) {
      view?.renderer?.next();
    }
  };

  return <div ref={viewRef} onClick={handleTap} />;
};

export default FoliateViewer;
