"use client";
import React from "react";
import YouTube from 'react-youtube';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css"; // or any other theme

const ChapterContent = ({ chapter, content }) => {

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
    },
  };

  const rawContent = typeof content === 'string'
    ? content
    : (typeof content?.content === 'string' ? content.content : '');

  return (
    <div className="p-10">
      <h2 className="font-medium text-2xl">{chapter?.name}</h2>
      <p className="text-gray-500">{chapter?.about}</p>

      {/* Video */}
      {content?.videoId && (
        <div className="flex justify-center my-6">
          <YouTube
            videoId={content?.videoId}
            opts={opts}
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none bg-white p-6 rounded-2xl shadow-md mt-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            h2: ({ node, ...props }) => (
              <h2 className="text-2xl font-bold text-blue-700 mt-6 mb-3" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xl font-semibold text-blue-600 mt-4 mb-2" {...props} />
            ),
            code: ({ inline, className, children, ...props }) => {
              // For inline code, return a simple code element
              if (inline) {
                return <code className="bg-gray-200 px-1 rounded" {...props}>{children}</code>;
              }

              // For block code, return pre directly
              return (
                <pre className="bg-gray-900 text-white p-3 rounded-lg overflow-x-auto my-4">
                  <code {...props}>{children}</code>
                </pre>
              );
            },
            ul: ({ node, ...props }) => (
              <ul className="list-disc ml-6 space-y-1" {...props} />
            ),
            details: ({ node, ...props }) => (
              <details className="my-4 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 group" {...props} />
            ),
            summary: ({ node, ...props }) => (
              <summary className="cursor-pointer p-4 bg-gray-100 font-medium text-indigo-700 hover:bg-gray-200 transition-colors list-none flex items-center justify-between select-none" {...props}>
                <span className="flex items-center gap-2">
                  {props.children}
                </span>
              </summary>
            ),
            li: ({ node, ...props }) => (
              <li className="list-disc ml-4" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong {...props} />
            ),
            span: ({ node, ...props }) => (
              <span {...props} />
            ),
            p: ({ node, ...props }) => (
              <div className="my-3 leading-relaxed text-gray-800" {...props} />
            ),
          }}
        >
          {rawContent && rawContent.trim() !== '' ? rawContent : '**No content available.**'}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ChapterContent;