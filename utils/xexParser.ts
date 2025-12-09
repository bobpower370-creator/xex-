import { XexSegment } from '../types';

export function parseXex(buffer: Uint8Array): XexSegment[] {
  const segments: XexSegment[] = [];
  let offset = 0;

  // Check for XEX header FF FF (optional but common, usually ignored by loaders as it just signifies a header)
  if (buffer.length > 2 && buffer[0] === 0xFF && buffer[1] === 0xFF) {
    offset = 2;
  }

  while (offset < buffer.length) {
    if (offset + 4 > buffer.length) break;

    const startLow = buffer[offset];
    const startHigh = buffer[offset + 1];
    const start = startHigh * 256 + startLow;

    const endLow = buffer[offset + 2];
    const endHigh = buffer[offset + 3];
    const end = endHigh * 256 + endLow;

    offset += 4;

    // Sanity check
    if (end < start) {
      console.warn("Invalid segment: end < start");
      break;
    }

    const length = end - start + 1;

    if (offset + length > buffer.length) {
      console.warn("Segment truncated");
      break;
    }

    const data = buffer.slice(offset, offset + length);
    segments.push({ start, end, data });

    offset += length;
  }

  // If no segments found (maybe raw binary?), treat whole file as one segment at $2000 (default load)
  if (segments.length === 0 && buffer.length > 0) {
      segments.push({
          start: 0x2000,
          end: 0x2000 + buffer.length - 1,
          data: buffer
      });
  }

  return segments;
}
