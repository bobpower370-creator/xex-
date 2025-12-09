import React, { useMemo } from 'react';
import { disassemble } from '../utils/disasm6502';
import { XexSegment } from '../types';

interface DisassemblyViewProps {
  segment: XexSegment;
  onSelectionChange?: (text: string) => void;
}

export const DisassemblyView: React.FC<DisassemblyViewProps> = ({ segment, onSelectionChange }) => {
  const instructions = useMemo(() => {
    return disassemble(segment.data, segment.start);
  }, [segment]);

  // Generate a text representation for copy/paste or AI
  const fullText = useMemo(() => {
    return instructions.map(inst => 
      `${inst.address.toString(16).toUpperCase().padStart(4, '0')}  ${inst.mnemonic} ${inst.operand || ''}`
    ).join('\n');
  }, [instructions]);

  // Simple "copy all" or selection handler logic
  // For this demo, we expose the full text via a ref or effect if needed, 
  // but we'll primarily rely on the parent requesting the text.
  
  return (
    <div className="font-mono text-xs sm:text-sm h-full overflow-auto bg-slate-900 p-4 rounded-lg border border-slate-700 select-text">
       <table className="w-full text-left border-collapse">
         <thead className="sticky top-0 bg-slate-800 text-slate-400">
           <tr>
             <th className="p-2 w-20">Addr</th>
             <th className="p-2 w-24 hidden sm:table-cell">Bytes</th>
             <th className="p-2 w-16">Op</th>
             <th className="p-2">Operand</th>
           </tr>
         </thead>
         <tbody>
           {instructions.map((inst) => (
             <tr key={inst.address} className="hover:bg-slate-800/50 border-b border-slate-800/50">
               <td className="p-1 text-blue-400">{inst.address.toString(16).toUpperCase().padStart(4, '0')}</td>
               <td className="p-1 text-slate-500 hidden sm:table-cell">
                 {inst.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
               </td>
               <td className="p-1 text-yellow-400 font-bold">{inst.mnemonic}</td>
               <td className="p-1 text-green-400">{inst.operand}</td>
             </tr>
           ))}
         </tbody>
       </table>
    </div>
  );
};
