import React, { useState, useRef, useCallback } from 'react';
import { Upload, Cpu, FileCode, AlertTriangle, Zap, Terminal } from 'lucide-react';
import { parseXex } from './utils/xexParser';
import { disassemble } from './utils/disasm6502';
import { decompileSegment } from './services/gemini';
import { XexSegment, DecompilationResult, ProcessingStatus } from './types';
import { DisassemblyView } from './components/DisassemblyView';
import { CppViewer } from './components/CppViewer';
import { Button } from './components/Button';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<XexSegment[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [result, setResult] = useState<DecompilationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setStatus(ProcessingStatus.ANALYZING);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = new Uint8Array(event.target?.result as ArrayBuffer);
        const parsedSegments = parseXex(buffer);
        setSegments(parsedSegments);
        setActiveSegmentIndex(0);
        setStatus(ProcessingStatus.IDLE);
      } catch (err) {
        setError("Failed to parse XEX file. Is it a valid binary?");
        setStatus(ProcessingStatus.ERROR);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleDecompile = async () => {
    if (segments.length === 0) return;

    const segment = segments[activeSegmentIndex];
    setStatus(ProcessingStatus.DECOMPILING);
    setError(null);

    try {
      // 1. Disassemble locally first to get text
      const instructions = disassemble(segment.data, segment.start);
      // Limit to first 200 instructions for demo purposes to save tokens/latency
      // In a real app, we'd paginate or stream.
      const limit = 300;
      const asmText = instructions.slice(0, limit).map(inst => 
        `${inst.address.toString(16).toUpperCase().padStart(4, '0')}  ${inst.mnemonic} ${inst.operand || ''}`
      ).join('\n');

      let promptText = asmText;
      if (instructions.length > limit) {
        promptText += `\n... (truncated ${instructions.length - limit} instructions)`;
      }

      // 2. Send to Gemini
      const decompResult = await decompileSegment(promptText);
      setResult(decompResult);
      setStatus(ProcessingStatus.COMPLETE);
    } catch (err) {
      console.error(err);
      setError("AI Decompilation failed. Check API Key or try a smaller segment.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/50">
               <Cpu size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                XEX-Ray
              </h1>
              <p className="text-xs text-slate-500 font-mono">AI-POWERED DECOMPILER</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <Terminal size={14} />
                <span>TARGET: 6502 / ATARI 8-BIT</span>
             </div>
             <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <Zap size={14} />
                <span>MODEL: GEMINI 3 PRO</span>
             </div>
             <Button variant="secondary" size="sm" onClick={() => window.open('https://github.com/google-gemini/cookbook', '_blank')}>
                Docs
             </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input & Disassembly */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-[calc(100vh-8rem)]">
          
          {/* File Upload Area */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <input 
              type="file" 
              accept=".xex,.bin,.com" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all group"
              >
                <Upload className="mb-4 text-slate-500 group-hover:text-blue-400 transition-colors" size={32} />
                <p className="text-sm font-medium text-slate-300">Drop .xex file or click to upload</p>
                <p className="text-xs text-slate-500 mt-1">Atari 8-bit executable</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700">
                 <div className="flex items-center gap-3 overflow-hidden">
                    <FileCode size={20} className="text-blue-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{segments.length} Segments found</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" onClick={() => { setFile(null); setSegments([]); setResult(null); }}>
                   Change
                 </Button>
              </div>
            )}
          </div>

          {/* Segment Selector */}
          {segments.length > 0 && (
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {segments.map((seg, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveSegmentIndex(idx); setResult(null); }}
                    className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-colors border ${
                      activeSegmentIndex === idx 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    SEG {idx}: ${seg.start.toString(16).toUpperCase()} - ${seg.end.toString(16).toUpperCase()}
                  </button>
                ))}
             </div>
          )}

          {/* Disassembly View */}
          <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 flex flex-col overflow-hidden shadow-inner shadow-black/20 relative">
            <div className="bg-slate-800 px-4 py-2 text-xs font-bold text-slate-400 flex justify-between items-center border-b border-slate-700">
              <span>DISASSEMBLY</span>
              <span className="text-slate-600">6502 ASM</span>
            </div>
            
            {segments.length > 0 ? (
               <DisassemblyView segment={segments[activeSegmentIndex]} />
            ) : (
               <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                 Waiting for file...
               </div>
            )}
            
            {segments.length > 0 && (
               <div className="absolute bottom-4 right-4 shadow-xl">
                 <Button 
                    onClick={handleDecompile} 
                    disabled={status === ProcessingStatus.DECOMPILING || status === ProcessingStatus.ANALYZING}
                    className="gap-2"
                 >
                    {status === ProcessingStatus.DECOMPILING ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Decompiling...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        AI Decompile Segment
                      </>
                    )}
                 </Button>
               </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Output */}
        <div className="lg:col-span-7 h-[calc(100vh-8rem)]">
          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-800 text-red-200 p-3 rounded-lg flex items-center gap-3 text-sm">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}
          
          <CppViewer 
            code={result?.cppCode || ''} 
            explanation={result?.explanation || ''} 
            loading={status === ProcessingStatus.DECOMPILING} 
          />
        </div>

      </main>
    </div>
  );
}
