/** Eight seconds of original synthesized audio, dedicated to CC0. No external recordings. */
export function createMockAudio(): Buffer {
  const sampleRate = 16000; const count = sampleRate * 8; const dataSize = count * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < count; i++) {
    const time = i / sampleRate; const envelope = Math.min(1, time * 4, (8 - time) * 4);
    buffer.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 220 * time) * envelope * 3000), 44 + i * 2);
  }
  return buffer;
}
