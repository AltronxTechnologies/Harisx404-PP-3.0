// MDX rendering for Server Components.
//
// Root cause of the earlier 500s ("A React Element from an older version of
// React was rendered"): next-mdx-remote v6 resolves react/jsx-runtime through
// a CJS shim inside node_modules (dist/jsx-runtime.cjs), which picks up the
// React copy in node_modules instead of the React build Next.js vendors for
// the Server Components renderer. The elements it creates therefore come from
// a different React than the one rendering them, and the RSC renderer throws.
//
// Fix: compile MDX ourselves with @mdx-js/mdx `evaluate`, handing it the
// jsx-runtime imported from *this* module — the bundler aliases that import
// to the correct React build for the server graph, so there is only ever one
// React in play. Interactive components (code copy buttons, link previews,
// playground) stay in the "use client" module and are referenced individually
// (a "use client" module's object export can't be spread inside an RSC, so we
// rebuild the map here from named exports).
import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import * as jsxDevRuntime from "react/jsx-dev-runtime";
import React from "react";
import {
  MdxH1,
  MdxH2,
  MdxH3,
  MdxH4,
  MdxH5,
  MdxH6,
  MdxTable,
  MdxTableWrapper,
  MdxTh,
  MdxLink,
  MdxImage,
  MdxCallout,
  MdxProsCard,
  MdxConsCard,
  MdxIdeaQuote,
  MdxInfoQuote,
  MdxThoughtQuote,
  MdxWarningQuote,
  MdxCode,
  MdxParagraph,
  MdxOrderedList,
  MdxUnorderedList,
  MdxListItem,
} from "./mdx-components";
import { CodePlayground } from "./CodePlayground";
import { Details, DetailsSummary } from "./Details";

interface MDXProps {
  code: string;
  components?: Record<string, React.ComponentType>;
  [key: string]: any;
}

// Same keys as sharedComponents in mdx-components.tsx, but assembled in a
// server module so the object is spreadable/readable during RSC rendering.
const serverComponentsMap = {
  h1: MdxH1,
  h2: MdxH2,
  h3: MdxH3,
  h4: MdxH4,
  h5: MdxH5,
  h6: MdxH6,
  Image: MdxImage,
  img: MdxImage,
  a: MdxLink,
  Callout: MdxCallout,
  ProsCard: MdxProsCard,
  ConsCard: MdxConsCard,
  Ideaquote: MdxIdeaQuote,
  Announcementquote: MdxInfoQuote,
  Infoquote: MdxInfoQuote,
  Thoughtquote: MdxThoughtQuote,
  Warningquote: MdxWarningQuote,
  code: MdxCode,
  Table: MdxTable,
  table: MdxTableWrapper,
  th: MdxTh,
  CodePlayground,
  Details,
  DetailsSummary,
  p: MdxParagraph,
  ol: MdxOrderedList,
  ul: MdxUnorderedList,
  li: MdxListItem,
};

const runtime =
  process.env.NODE_ENV === "production"
    ? { ...jsxRuntime, development: false }
    : { ...jsxDevRuntime, development: true };

export const MDXContent = async ({ code, components }: MDXProps) => {
  try {
    const { default: Content } = await evaluate(code, runtime as any);
    return (
      <Content
        components={{ ...serverComponentsMap, ...components } as any}
      />
    );
  } catch (error) {
    console.warn("MDX compile failed, rendering raw content fallback:", error);
    return (
      <pre className="whitespace-pre-wrap text-base leading-7 text-text-secondary">
        {code}
      </pre>
    );
  }
};
