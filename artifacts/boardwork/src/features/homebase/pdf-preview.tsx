import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({
  url,
  title,
  onError,
}: {
  url: string;
  title: string;
  onError: () => void;
}) {
  const [doc, setDoc] = useState<PDFDocumentProxy>();
  const [number, setNumber] = useState(1);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    const task = getDocument({ url, useSystemFonts: true });
    task.promise
      .then((pdf) => {
        if (active) setDoc(pdf);
      })
      .catch(() => {
        if (active) onError();
      });
    return () => {
      active = false;
      void task.destroy();
    };
  }, [url, onError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;
    let active = true;
    let render: RenderTask | undefined;
    async function paint(pdf: PDFDocumentProxy, element: HTMLCanvasElement) {
      const page = await pdf.getPage(number);
      if (!active) return;
      const size = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: 1800 / Math.max(size.width, size.height),
      });
      element.width = Math.ceil(viewport.width);
      element.height = Math.ceil(viewport.height);
      render = page.render({ canvas: element, viewport });
      await render.promise;
      if (active) setReady(true);
    }
    paint(doc, canvas).catch(() => {
      if (active) onError();
    });
    return () => {
      active = false;
      render?.cancel();
    };
  }, [doc, number, onError]);

  function turn(next: number) {
    setReady(false);
    setNumber(next);
  }

  return (
    <>
      <div className="hb-pdf-page" aria-busy={!ready} key={number}>
        {!ready && (
          <span className="hb-media-loading" role="status">
            Loading page…
          </span>
        )}
        <canvas
          ref={canvasRef}
          hidden={!ready}
          role="img"
          aria-label={`${title}, page ${number}`}
        />
      </div>
      {doc && (
        <div className="hb-pdf-controls">
          {doc.numPages > 1 && (
            <button
              type="button"
              aria-label="Previous page"
              disabled={number === 1}
              onClick={() => turn(number - 1)}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <span aria-live="polite">
            Page {number} of {doc.numPages}
          </span>
          {doc.numPages > 1 && (
            <button
              type="button"
              aria-label="Next page"
              disabled={number === doc.numPages}
              onClick={() => turn(number + 1)}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
