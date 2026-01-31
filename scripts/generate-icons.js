import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { deflateSync } from 'zlib';

// Simple PNG generator for placeholder icons
function createPNG(size) {
  // PNG header and simple colored square
  const width = size;
  const height = size;

  // Create a simple BMP-style data that we'll convert
  const canvas = [];

  // PNG signature
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  // For simplicity, create a minimal valid PNG
  // This creates a solid blue square icon

  // IHDR chunk
  const ihdr = createIHDRChunk(width, height);

  // IDAT chunk (image data)
  const idat = createIDATChunk(width, height);

  // IEND chunk
  const iend = createIENDChunk();

  return Buffer.concat([
    Buffer.from(signature),
    ihdr,
    idat,
    iend
  ]);
}

function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;  // bit depth
  data[9] = 2;  // color type (RGB)
  data[10] = 0; // compression
  data[11] = 0; // filter
  data[12] = 0; // interlace

  return createChunk('IHDR', data);
}

function createIDATChunk(width, height) {
  // Create raw image data (RGB, with filter byte per row)
  const rowSize = 1 + width * 3; // filter byte + RGB pixels
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      // Blue color (#3B82F6)
      rawData[pixelStart] = 0x3b;     // R
      rawData[pixelStart + 1] = 0x82; // G
      rawData[pixelStart + 2] = 0xf6; // B
    }
  }

  const compressed = deflateSync(rawData);
  return createChunk('IDAT', compressed);
}

function createIENDChunk() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  const table = getCRCTable();

  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

let crcTable = null;
function getCRCTable() {
  if (crcTable) return crcTable;

  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    crcTable[n] = c;
  }
  return crcTable;
}

// Generate icons
const sizes = [16, 48, 128];
const outputDir = './public/icons';

try {
  mkdirSync(outputDir, { recursive: true });
} catch (e) {}

for (const size of sizes) {
  const png = createPNG(size);
  const filename = `${outputDir}/icon${size}.png`;
  writeFileSync(filename, png);
  console.log(`Generated ${filename}`);
}
