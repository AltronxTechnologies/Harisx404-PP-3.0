"use client";

import { useEffect, useRef, useState } from "react";
import { FileWarning, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function ResumePdfViewer({ fileUrl }: { fileUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => setWidth(Math.floor(container.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-w-0" data-resume-pdf-viewer>
      {width > 0 && (
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setPages(numPages)}
          loading={
            <div role="status" className="flex min-h-[480px] items-center justify-center rounded-3xl border border-border-primary bg-white text-sm text-neutral-600">
              <Loader2 className="mr-2 size-5 animate-spin motion-reduce:animate-none" />
              Loading Resume…
            </div>
          }
          error={
            <div role="alert" className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-border-primary bg-white px-6 text-center text-neutral-700">
              <FileWarning className="size-8 text-[#1e64c8]" aria-hidden />
              <p className="mt-4 font-medium text-neutral-900">The inline preview could not be loaded.</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e64c8]">
                Open the PDF directly<span className="sr-only"> in a new tab</span>
              </a>
            </div>
          }
          className="space-y-5"
        >
          {Array.from({ length: pages }, (_, index) => (
            <figure key={index + 1} aria-label={`Resume page ${index + 1} of ${pages}`} className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.45)] dark:shadow-[0_26px_90px_-38px_rgba(0,0,0,0.9)]">
              <Page
                pageNumber={index + 1}
                width={Math.min(width - 2, 960)}
                renderAnnotationLayer
                renderTextLayer
                loading={<div className="aspect-[1/1.414] animate-pulse bg-neutral-100 motion-reduce:animate-none" />}
                className="[&_.react-pdf__Page__canvas]:!h-auto [&_.react-pdf__Page__canvas]:!max-w-full"
              />
              <figcaption className="sr-only">Page {index + 1} of {pages}</figcaption>
            </figure>
          ))}
        </Document>
      )}
    </div>
  );
}
