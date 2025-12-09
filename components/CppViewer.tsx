import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CppViewerProps {
  code: string;
  explanation: string;
  loading: boolean;
}

export const CppViewer: React.FC<CppViewerProps> = ({ code, explanation, loading }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900 rounded-lg border border-slate-700 animate-pulse">
        <div className="mb-4 text-4xl">🤖</div>
        <p>Gemini is analyzing binary patterns...</p>
        <p className="text-xs mt-2 text-slate-500">Decompiling 6502 to C++</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 rounded-lg border border-slate-700 p-8 text-center">
        <p>Select a segment and click "Decompile" to generate C++ code.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
        <span className="text-xs font-bold text-slate-300">GENERATED_SOURCE.CPP</span>
        <button 
          onClick={handleCopy}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="font-mono text-sm text-slate-200 whitespace-pre-wrap">
          <code dangerouslySetInnerHTML={{ 
            __html: code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/(#include|using|namespace|void|int|char|bool|return|if|else|while|for)/g, '<span class="text-purple-400">$1</span>')
              .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
          }} />
        </pre>
        
        {explanation && (
          <div className="mt-8 pt-4 border-t border-slate-700">
            <h3 className="text-sm font-bold text-blue-400 mb-2">AI Analysis</h3>
            <div className="text-sm text-slate-300 prose prose-invert max-w-none">
              <p>{explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
