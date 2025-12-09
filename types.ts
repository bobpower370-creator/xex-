export interface XexSegment {
  start: number;
  end: number;
  data: Uint8Array;
}

export interface ParsedInstruction {
  address: number;
  bytes: number[];
  mnemonic: string;
  operand: string | null;
  mode: string;
}

export enum ViewMode {
  HEX = 'HEX',
  DISASM = 'DISASM',
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  DECOMPILING = 'DECOMPILING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface DecompilationResult {
  cppCode: string;
  explanation: string;
}
