import { ParsedInstruction } from '../types';

// Addressing Modes
const IMP = 'IMP'; // Implicit
const ACC = 'ACC'; // Accumulator
const IMM = 'IMM'; // Immediate #$00
const ZP  = 'ZP';  // Zero Page $00
const ZPX = 'ZPX'; // Zero Page,X $00,X
const ZPY = 'ZPY'; // Zero Page,Y $00,Y
const REL = 'REL'; // Relative $0000 (branch)
const ABS = 'ABS'; // Absolute $0000
const ABX = 'ABX'; // Absolute,X $0000,X
const ABY = 'ABY'; // Absolute,Y $0000,Y
const IND = 'IND'; // Indirect ($0000)
const IZX = 'IZX'; // Indexed Indirect ($00,X)
const IZY = 'IZY'; // Indirect Indexed ($00),Y

interface OpcodeDef {
  mnemonic: string;
  mode: string;
  bytes: number;
}

// Compact opcode table (Standard 6502)
const OPCODES: { [key: number]: OpcodeDef } = {
  0x00: { mnemonic: 'BRK', mode: IMP, bytes: 1 }, 0x01: { mnemonic: 'ORA', mode: IZX, bytes: 2 },
  0x05: { mnemonic: 'ORA', mode: ZP, bytes: 2 },  0x06: { mnemonic: 'ASL', mode: ZP, bytes: 2 },
  0x08: { mnemonic: 'PHP', mode: IMP, bytes: 1 }, 0x09: { mnemonic: 'ORA', mode: IMM, bytes: 2 },
  0x0A: { mnemonic: 'ASL', mode: ACC, bytes: 1 }, 0x0D: { mnemonic: 'ORA', mode: ABS, bytes: 3 },
  0x0E: { mnemonic: 'ASL', mode: ABS, bytes: 3 }, 0x10: { mnemonic: 'BPL', mode: REL, bytes: 2 },
  0x11: { mnemonic: 'ORA', mode: IZY, bytes: 2 }, 0x15: { mnemonic: 'ORA', mode: ZPX, bytes: 2 },
  0x16: { mnemonic: 'ASL', mode: ZPX, bytes: 2 }, 0x18: { mnemonic: 'CLC', mode: IMP, bytes: 1 },
  0x19: { mnemonic: 'ORA', mode: ABY, bytes: 3 }, 0x1D: { mnemonic: 'ORA', mode: ABX, bytes: 3 },
  0x1E: { mnemonic: 'ASL', mode: ABX, bytes: 3 }, 0x20: { mnemonic: 'JSR', mode: ABS, bytes: 3 },
  0x21: { mnemonic: 'AND', mode: IZX, bytes: 2 }, 0x24: { mnemonic: 'BIT', mode: ZP, bytes: 2 },
  0x25: { mnemonic: 'AND', mode: ZP, bytes: 2 },  0x26: { mnemonic: 'ROL', mode: ZP, bytes: 2 },
  0x28: { mnemonic: 'PLP', mode: IMP, bytes: 1 }, 0x29: { mnemonic: 'AND', mode: IMM, bytes: 2 },
  0x2A: { mnemonic: 'ROL', mode: ACC, bytes: 1 }, 0x2C: { mnemonic: 'BIT', mode: ABS, bytes: 3 },
  0x2D: { mnemonic: 'AND', mode: ABS, bytes: 3 }, 0x2E: { mnemonic: 'ROL', mode: ABS, bytes: 3 },
  0x30: { mnemonic: 'BMI', mode: REL, bytes: 2 }, 0x31: { mnemonic: 'AND', mode: IZY, bytes: 2 },
  0x35: { mnemonic: 'AND', mode: ZPX, bytes: 2 }, 0x36: { mnemonic: 'ROL', mode: ZPX, bytes: 2 },
  0x38: { mnemonic: 'SEC', mode: IMP, bytes: 1 }, 0x39: { mnemonic: 'AND', mode: ABY, bytes: 3 },
  0x3D: { mnemonic: 'AND', mode: ABX, bytes: 3 }, 0x3E: { mnemonic: 'ROL', mode: ABX, bytes: 3 },
  0x40: { mnemonic: 'RTI', mode: IMP, bytes: 1 }, 0x41: { mnemonic: 'EOR', mode: IZX, bytes: 2 },
  0x45: { mnemonic: 'EOR', mode: ZP, bytes: 2 },  0x46: { mnemonic: 'LSR', mode: ZP, bytes: 2 },
  0x48: { mnemonic: 'PHA', mode: IMP, bytes: 1 }, 0x49: { mnemonic: 'EOR', mode: IMM, bytes: 2 },
  0x4A: { mnemonic: 'LSR', mode: ACC, bytes: 1 }, 0x4C: { mnemonic: 'JMP', mode: ABS, bytes: 3 },
  0x4D: { mnemonic: 'EOR', mode: ABS, bytes: 3 }, 0x4E: { mnemonic: 'LSR', mode: ABS, bytes: 3 },
  0x50: { mnemonic: 'BVC', mode: REL, bytes: 2 }, 0x51: { mnemonic: 'EOR', mode: IZY, bytes: 2 },
  0x55: { mnemonic: 'EOR', mode: ZPX, bytes: 2 }, 0x56: { mnemonic: 'LSR', mode: ZPX, bytes: 2 },
  0x58: { mnemonic: 'CLI', mode: IMP, bytes: 1 }, 0x59: { mnemonic: 'EOR', mode: ABY, bytes: 3 },
  0x5D: { mnemonic: 'EOR', mode: ABX, bytes: 3 }, 0x5E: { mnemonic: 'LSR', mode: ABX, bytes: 3 },
  0x60: { mnemonic: 'RTS', mode: IMP, bytes: 1 }, 0x61: { mnemonic: 'ADC', mode: IZX, bytes: 2 },
  0x65: { mnemonic: 'ADC', mode: ZP, bytes: 2 },  0x66: { mnemonic: 'ROR', mode: ZP, bytes: 2 },
  0x68: { mnemonic: 'PLA', mode: IMP, bytes: 1 }, 0x69: { mnemonic: 'ADC', mode: IMM, bytes: 2 },
  0x6A: { mnemonic: 'ROR', mode: ACC, bytes: 1 }, 0x6C: { mnemonic: 'JMP', mode: IND, bytes: 3 },
  0x6D: { mnemonic: 'ADC', mode: ABS, bytes: 3 }, 0x6E: { mnemonic: 'ROR', mode: ABS, bytes: 3 },
  0x70: { mnemonic: 'BVS', mode: REL, bytes: 2 }, 0x71: { mnemonic: 'ADC', mode: IZY, bytes: 2 },
  0x75: { mnemonic: 'ADC', mode: ZPX, bytes: 2 }, 0x76: { mnemonic: 'ROR', mode: ZPX, bytes: 2 },
  0x78: { mnemonic: 'SEI', mode: IMP, bytes: 1 }, 0x79: { mnemonic: 'ADC', mode: ABY, bytes: 3 },
  0x7D: { mnemonic: 'ADC', mode: ABX, bytes: 3 }, 0x7E: { mnemonic: 'ROR', mode: ABX, bytes: 3 },
  0x81: { mnemonic: 'STA', mode: IZX, bytes: 2 }, 0x84: { mnemonic: 'STY', mode: ZP, bytes: 2 },
  0x85: { mnemonic: 'STA', mode: ZP, bytes: 2 },  0x86: { mnemonic: 'STX', mode: ZP, bytes: 2 },
  0x88: { mnemonic: 'DEY', mode: IMP, bytes: 1 }, 0x8A: { mnemonic: 'TXA', mode: IMP, bytes: 1 },
  0x8C: { mnemonic: 'STY', mode: ABS, bytes: 3 }, 0x8D: { mnemonic: 'STA', mode: ABS, bytes: 3 },
  0x8E: { mnemonic: 'STX', mode: ABS, bytes: 3 }, 0x90: { mnemonic: 'BCC', mode: REL, bytes: 2 },
  0x91: { mnemonic: 'STA', mode: IZY, bytes: 2 }, 0x94: { mnemonic: 'STY', mode: ZPX, bytes: 2 },
  0x95: { mnemonic: 'STA', mode: ZPX, bytes: 2 }, 0x96: { mnemonic: 'STX', mode: ZPY, bytes: 2 },
  0x98: { mnemonic: 'TYA', mode: IMP, bytes: 1 }, 0x99: { mnemonic: 'STA', mode: ABY, bytes: 3 },
  0x9A: { mnemonic: 'TXS', mode: IMP, bytes: 1 }, 0x9D: { mnemonic: 'STA', mode: ABX, bytes: 3 },
  0xA0: { mnemonic: 'LDY', mode: IMM, bytes: 2 }, 0xA1: { mnemonic: 'LDA', mode: IZX, bytes: 2 },
  0xA2: { mnemonic: 'LDX', mode: IMM, bytes: 2 }, 0xA4: { mnemonic: 'LDY', mode: ZP, bytes: 2 },
  0xA5: { mnemonic: 'LDA', mode: ZP, bytes: 2 },  0xA6: { mnemonic: 'LDX', mode: ZP, bytes: 2 },
  0xA8: { mnemonic: 'TAY', mode: IMP, bytes: 1 }, 0xA9: { mnemonic: 'LDA', mode: IMM, bytes: 2 },
  0xAA: { mnemonic: 'TAX', mode: IMP, bytes: 1 }, 0xAC: { mnemonic: 'LDY', mode: ABS, bytes: 3 },
  0xAD: { mnemonic: 'LDA', mode: ABS, bytes: 3 }, 0xAE: { mnemonic: 'LDX', mode: ABS, bytes: 3 },
  0xB0: { mnemonic: 'BCS', mode: REL, bytes: 2 }, 0xB1: { mnemonic: 'LDA', mode: IZY, bytes: 2 },
  0xB4: { mnemonic: 'LDY', mode: ZPX, bytes: 2 }, 0xB5: { mnemonic: 'LDA', mode: ZPX, bytes: 2 },
  0xB6: { mnemonic: 'LDX', mode: ZPY, bytes: 2 }, 0xB8: { mnemonic: 'CLV', mode: IMP, bytes: 1 },
  0xB9: { mnemonic: 'LDA', mode: ABY, bytes: 3 }, 0xBA: { mnemonic: 'TSX', mode: IMP, bytes: 1 },
  0xBC: { mnemonic: 'LDY', mode: ABX, bytes: 3 }, 0xBD: { mnemonic: 'LDA', mode: ABX, bytes: 3 },
  0xBE: { mnemonic: 'LDX', mode: ABY, bytes: 3 }, 0xC0: { mnemonic: 'CPY', mode: IMM, bytes: 2 },
  0xC1: { mnemonic: 'CMP', mode: IZX, bytes: 2 }, 0xC4: { mnemonic: 'CPY', mode: ZP, bytes: 2 },
  0xC5: { mnemonic: 'CMP', mode: ZP, bytes: 2 },  0xC6: { mnemonic: 'DEC', mode: ZP, bytes: 2 },
  0xC8: { mnemonic: 'INY', mode: IMP, bytes: 1 }, 0xC9: { mnemonic: 'CMP', mode: IMM, bytes: 2 },
  0xCA: { mnemonic: 'DEX', mode: IMP, bytes: 1 }, 0xCC: { mnemonic: 'CPY', mode: ABS, bytes: 3 },
  0xCD: { mnemonic: 'CMP', mode: ABS, bytes: 3 }, 0xCE: { mnemonic: 'DEC', mode: ABS, bytes: 3 },
  0xD0: { mnemonic: 'BNE', mode: REL, bytes: 2 }, 0xD1: { mnemonic: 'CMP', mode: IZY, bytes: 2 },
  0xD5: { mnemonic: 'CMP', mode: ZPX, bytes: 2 }, 0xD6: { mnemonic: 'DEC', mode: ZPX, bytes: 2 },
  0xD8: { mnemonic: 'CLD', mode: IMP, bytes: 1 }, 0xD9: { mnemonic: 'CMP', mode: ABY, bytes: 3 },
  0xDD: { mnemonic: 'CMP', mode: ABX, bytes: 3 }, 0xDE: { mnemonic: 'DEC', mode: ABX, bytes: 3 },
  0xE0: { mnemonic: 'CPX', mode: IMM, bytes: 2 }, 0xE1: { mnemonic: 'SBC', mode: IZX, bytes: 2 },
  0xE4: { mnemonic: 'CPX', mode: ZP, bytes: 2 },  0xE5: { mnemonic: 'SBC', mode: ZP, bytes: 2 },
  0xE6: { mnemonic: 'INC', mode: ZP, bytes: 2 },  0xE8: { mnemonic: 'INX', mode: IMP, bytes: 1 },
  0xE9: { mnemonic: 'SBC', mode: IMM, bytes: 2 }, 0xEA: { mnemonic: 'NOP', mode: IMP, bytes: 1 },
  0xEC: { mnemonic: 'CPX', mode: ABS, bytes: 3 }, 0xED: { mnemonic: 'SBC', mode: ABS, bytes: 3 },
  0xEE: { mnemonic: 'INC', mode: ABS, bytes: 3 }, 0xF0: { mnemonic: 'BEQ', mode: REL, bytes: 2 },
  0xF1: { mnemonic: 'SBC', mode: IZY, bytes: 2 }, 0xF5: { mnemonic: 'SBC', mode: ZPX, bytes: 2 },
  0xF6: { mnemonic: 'INC', mode: ZPX, bytes: 2 }, 0xF8: { mnemonic: 'SED', mode: IMP, bytes: 1 },
  0xF9: { mnemonic: 'SBC', mode: ABY, bytes: 3 }, 0xFD: { mnemonic: 'SBC', mode: ABX, bytes: 3 },
  0xFE: { mnemonic: 'INC', mode: ABX, bytes: 3 },
};

function toHex8(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, '0');
}

function toHex16(n: number): string {
  return n.toString(16).toUpperCase().padStart(4, '0');
}

export function disassemble(data: Uint8Array, startAddress: number): ParsedInstruction[] {
  const instructions: ParsedInstruction[] = [];
  let offset = 0;

  while (offset < data.length) {
    const pc = startAddress + offset;
    const opcode = data[offset];
    const def = OPCODES[opcode];

    if (!def) {
      // Unknown opcode, treat as DB
      instructions.push({
        address: pc,
        bytes: [opcode],
        mnemonic: '???',
        operand: null,
        mode: 'UNK',
      });
      offset += 1;
      continue;
    }

    if (offset + def.bytes > data.length) {
       // Incomplete instruction at end of segment
       instructions.push({
        address: pc,
        bytes: Array.from(data.slice(offset)),
        mnemonic: '???',
        operand: null,
        mode: 'UNK',
      });
      break;
    }

    const bytes = Array.from(data.slice(offset, offset + def.bytes));
    let operand = '';

    // Decode operand based on mode
    const byte1 = bytes[1];
    const byte2 = bytes[2];

    switch (def.mode) {
      case IMM: operand = `#$${toHex8(byte1)}`; break;
      case ZP:  operand = `$${toHex8(byte1)}`; break;
      case ZPX: operand = `$${toHex8(byte1)},X`; break;
      case ZPY: operand = `$${toHex8(byte1)},Y`; break;
      case ABS: operand = `$${toHex16(byte2 * 256 + byte1)}`; break;
      case ABX: operand = `$${toHex16(byte2 * 256 + byte1)},X`; break;
      case ABY: operand = `$${toHex16(byte2 * 256 + byte1)},Y`; break;
      case IND: operand = `($${toHex16(byte2 * 256 + byte1)})`; break;
      case IZX: operand = `($${toHex8(byte1)},X)`; break;
      case IZY: operand = `($${toHex8(byte1)}),Y`; break;
      case REL:
        // Relative branch
        let rel = byte1;
        if (rel > 127) rel -= 256;
        const dest = pc + 2 + rel;
        operand = `$${toHex16(dest)}`;
        break;
      case ACC: operand = 'A'; break;
      case IMP: operand = ''; break;
      default: operand = '';
    }

    instructions.push({
      address: pc,
      bytes,
      mnemonic: def.mnemonic,
      operand,
      mode: def.mode
    });

    offset += def.bytes;
  }

  return instructions;
}
