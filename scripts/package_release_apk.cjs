const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const sourceApk = 'D:/build/restaurant-mobile/app/outputs/flutter-apk/app-arm64-v8a-release.apk';
if (!fs.existsSync(sourceApk)) {
  console.error('Source APK not found at:', sourceApk);
  process.exit(1);
}

console.log('Reading source APK:', sourceApk);
const inFd = fs.openSync(sourceApk, 'r');
const inStat = fs.statSync(sourceApk);
const inSize = inStat.size;

// Find EOCD (End of Central Directory)
const searchLen = Math.min(inSize, 65536);
const tailBuf = Buffer.alloc(searchLen);
fs.readSync(inFd, tailBuf, 0, searchLen, inSize - searchLen);

let eocdPos = -1;
for (let i = searchLen - 22; i >= 0; i--) {
  if (tailBuf.readUInt32LE(i) === 0x06054b50) {
    eocdPos = inSize - searchLen + i;
    break;
  }
}

if (eocdPos === -1) {
  console.error('Failed to locate EOCD');
  process.exit(1);
}

const eocdBuf = Buffer.alloc(22);
fs.readSync(inFd, eocdBuf, 0, 22, eocdPos);
const totalEntries = eocdBuf.readUInt16LE(10);
const cdSize = eocdBuf.readUInt32LE(12);
const cdOffset = eocdBuf.readUInt32LE(16);

console.log(`Found ${totalEntries} entries, CD size: ${cdSize}, CD offset: ${cdOffset}`);

const cdBuf = Buffer.alloc(cdSize);
fs.readSync(inFd, cdBuf, 0, cdSize, cdOffset);

// Parse Central Directory Entries
let pos = 0;
const entries = [];
while (pos < cdSize) {
  if (cdBuf.readUInt32LE(pos) !== 0x02014b50) break;
  const method = cdBuf.readUInt16LE(pos + 10);
  const time = cdBuf.readUInt16LE(pos + 12);
  const date = cdBuf.readUInt16LE(pos + 14);
  const crc32 = cdBuf.readUInt32LE(pos + 16);
  const compSize = cdBuf.readUInt32LE(pos + 20);
  const uncompSize = cdBuf.readUInt32LE(pos + 24);
  const nameLen = cdBuf.readUInt16LE(pos + 28);
  const extraLen = cdBuf.readUInt16LE(pos + 30);
  const commentLen = cdBuf.readUInt16LE(pos + 32);
  const localHeaderOffset = cdBuf.readUInt32LE(pos + 42);

  const name = cdBuf.toString('utf8', pos + 46, pos + 46 + nameLen);
  entries.push({
    name,
    method,
    time,
    date,
    crc32,
    compSize,
    uncompSize,
    localHeaderOffset
  });

  pos += 46 + nameLen + extraLen + commentLen;
}

console.log(`Parsed ${entries.length} zip entries`);

// Filter out old signature files in META-INF (.SF, .RSA, .DSA, .EC, MANIFEST.MF)
const filteredEntries = entries.filter(e => {
  const upper = e.name.toUpperCase();
  if (upper.startsWith('META-INF/') && (upper.endsWith('.SF') || upper.endsWith('.RSA') || upper.endsWith('.DSA') || upper.endsWith('.MF'))) {
    return false;
  }
  return true;
});

console.log(`Retaining ${filteredEntries.length} entries for re-packaging`);

// Create unaligned zip
const unalignedPath = path.resolve(__dirname, '../scratch/freshmart_unaligned.apk');
fs.mkdirSync(path.dirname(unalignedPath), { recursive: true });
const outFd = fs.openSync(unalignedPath, 'w');

let outOffset = 0;
const newCdEntries = [];

for (const entry of filteredEntries) {
  // Read local file header
  const lfhBuf = Buffer.alloc(30);
  fs.readSync(inFd, lfhBuf, 0, 30, entry.localHeaderOffset);
  const lfhNameLen = lfhBuf.readUInt16LE(26);
  const lfhExtraLen = lfhBuf.readUInt16LE(28);

  const dataOffset = entry.localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
  const rawData = Buffer.alloc(entry.compSize);
  fs.readSync(inFd, rawData, 0, entry.compSize, dataOffset);

  let uncompressedData;
  if (entry.method === 0) {
    uncompressedData = rawData;
  } else if (entry.method === 8) {
    uncompressedData = zlib.inflateRawSync(rawData);
  } else {
    uncompressedData = rawData;
  }

  // Compress with deflate
  const deflated = zlib.deflateRawSync(uncompressedData, { level: 9 });
  let finalMethod = 8;
  let finalCompData = deflated;

  if (deflated.length >= uncompressedData.length) {
    // Store uncompressed if deflation doesn't help
    finalMethod = 0;
    finalCompData = uncompressedData;
  }

  const nameBuf = Buffer.from(entry.name, 'utf8');

  // Write Local File Header
  const newLfh = Buffer.alloc(30);
  newLfh.writeUInt32LE(0x04034b50, 0);
  newLfh.writeUInt16LE(20, 4); // version needed
  newLfh.writeUInt16LE(0, 6);  // flags
  newLfh.writeUInt16LE(finalMethod, 8);
  newLfh.writeUInt16LE(entry.time, 10);
  newLfh.writeUInt16LE(entry.date, 12);
  newLfh.writeUInt32LE(entry.crc32, 14);
  newLfh.writeUInt32LE(finalCompData.length, 18);
  newLfh.writeUInt32LE(uncompressedData.length, 22);
  newLfh.writeUInt16LE(nameBuf.length, 26);
  newLfh.writeUInt16LE(0, 28); // no extra

  const currentLocalOffset = outOffset;
  fs.writeSync(outFd, newLfh);
  fs.writeSync(outFd, nameBuf);
  fs.writeSync(outFd, finalCompData);
  outOffset += 30 + nameBuf.length + finalCompData.length;

  newCdEntries.push({
    nameBuf,
    method: finalMethod,
    time: entry.time,
    date: entry.date,
    crc32: entry.crc32,
    compSize: finalCompData.length,
    uncompSize: uncompressedData.length,
    localOffset: currentLocalOffset
  });
}

// Write Central Directory
const cdStartOffset = outOffset;
for (const cd of newCdEntries) {
  const cdRecord = Buffer.alloc(46);
  cdRecord.writeUInt32LE(0x02014b50, 0);
  cdRecord.writeUInt16LE(20, 4); // version made by
  cdRecord.writeUInt16LE(20, 6); // version needed
  cdRecord.writeUInt16LE(0, 8);  // flags
  cdRecord.writeUInt16LE(cd.method, 10);
  cdRecord.writeUInt16LE(cd.time, 12);
  cdRecord.writeUInt16LE(cd.date, 14);
  cdRecord.writeUInt32LE(cd.crc32, 16);
  cdRecord.writeUInt32LE(cd.compSize, 20);
  cdRecord.writeUInt32LE(cd.uncompSize, 24);
  cdRecord.writeUInt16LE(cd.nameBuf.length, 28);
  cdRecord.writeUInt16LE(0, 30); // extra len
  cdRecord.writeUInt16LE(0, 32); // comment len
  cdRecord.writeUInt16LE(0, 34); // disk number start
  cdRecord.writeUInt16LE(0, 36); // internal file attributes
  cdRecord.writeUInt32LE(0, 38); // external file attributes
  cdRecord.writeUInt32LE(cd.localOffset, 42);

  fs.writeSync(outFd, cdRecord);
  fs.writeSync(outFd, cd.nameBuf);
  outOffset += 46 + cd.nameBuf.length;
}

const newCdSize = outOffset - cdStartOffset;

// Write EOCD
const newEocd = Buffer.alloc(22);
newEocd.writeUInt32LE(0x06054b50, 0);
newEocd.writeUInt16LE(0, 4); // disk num
newEocd.writeUInt16LE(0, 6); // start disk
newEocd.writeUInt16LE(newCdEntries.length, 8);
newEocd.writeUInt16LE(newCdEntries.length, 10);
newEocd.writeUInt32LE(newCdSize, 12);
newEocd.writeUInt32LE(cdStartOffset, 16);
newEocd.writeUInt16LE(0, 20); // comment len

fs.writeSync(outFd, newEocd);
fs.closeSync(outFd);
fs.closeSync(inFd);

const unalignedStat = fs.statSync(unalignedPath);
console.log(`Unaligned compressed APK created: ${(unalignedStat.size / (1024*1024)).toFixed(2)} MB`);
