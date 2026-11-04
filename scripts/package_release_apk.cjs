const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

// Helper CRC32 table
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = makeCrcTable();
function calcCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const sourceApkArm64 = 'D:/build/restaurant-mobile/app/outputs/flutter-apk/app-arm64-v8a-release.apk';
const sourceApkArmV7 = 'D:/build/restaurant-mobile/app/outputs/flutter-apk/app-armeabi-v7a-release.apk';

if (!fs.existsSync(sourceApkArm64)) {
  console.error('Source APK arm64 not found at:', sourceApkArm64);
  process.exit(1);
}

function parseZipEntries(apkPath) {
  const inFd = fs.openSync(apkPath, 'r');
  const inStat = fs.statSync(apkPath);
  const inSize = inStat.size;

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
    throw new Error('Failed to locate EOCD in ' + apkPath);
  }

  const eocdBuf = Buffer.alloc(22);
  fs.readSync(inFd, eocdBuf, 0, 22, eocdPos);
  const totalEntries = eocdBuf.readUInt16LE(10);
  const cdSize = eocdBuf.readUInt32LE(12);
  const cdOffset = eocdBuf.readUInt32LE(16);

  const cdBuf = Buffer.alloc(cdSize);
  fs.readSync(inFd, cdBuf, 0, cdSize, cdOffset);

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
      localHeaderOffset,
      apkPath
    });

    pos += 46 + nameLen + extraLen + commentLen;
  }
  fs.closeSync(inFd);
  return entries;
}

console.log('Reading entries from arm64 APK...');
const arm64Entries = parseZipEntries(sourceApkArm64);

// Filter out old signatures
const baseEntries = arm64Entries.filter((e) => {
  const upper = e.name.toUpperCase();
  if (
    upper.startsWith('META-INF/') &&
    (upper.endsWith('.SF') ||
      upper.endsWith('.RSA') ||
      upper.endsWith('.DSA') ||
      upper.endsWith('.EC') ||
      upper.endsWith('.MF'))
  ) {
    return false;
  }
  return true;
});

// Include armeabi-v7a native libs if available
let allEntriesToPack = [...baseEntries];
if (fs.existsSync(sourceApkArmV7)) {
  console.log('Reading armeabi-v7a native libraries for universal device support...');
  const v7Entries = parseZipEntries(sourceApkArmV7);
  const v7Libs = v7Entries.filter((e) => e.name.startsWith('lib/armeabi-v7a/'));
  allEntriesToPack.push(...v7Libs);
}

console.log(`Total entries to package: ${allEntriesToPack.length}`);

// Scratch path on D: drive where there is 90+ GB free
const unalignedPath = 'D:/Temp/freshmart_unaligned.apk';
const alignedPath = 'D:/Temp/freshmart_aligned.apk';
fs.mkdirSync(path.dirname(unalignedPath), { recursive: true });
const outFd = fs.openSync(unalignedPath, 'w');

let outOffset = 0;
const newCdEntries = [];

// Open file descriptors for source APKs
const fdMap = {};
for (const entry of allEntriesToPack) {
  if (!fdMap[entry.apkPath]) {
    fdMap[entry.apkPath] = fs.openSync(entry.apkPath, 'r');
  }
}

for (const entry of allEntriesToPack) {
  const inFd = fdMap[entry.apkPath];
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

  // CRITICAL FIX: Patch AndroidManifest.xml so android:extractNativeLibs = true
  // In the binary XML, extractNativeLibs is attribute index 21, and its boolean data is at offset 5340.
  // Setting it to 0xffffffff (true) tells Android PackageParser to extract native libraries to disk,
  // preventing "There was a problem while parsing the package." when installing!
  if (entry.name === 'AndroidManifest.xml') {
    console.log('Patching AndroidManifest.xml to force android:extractNativeLibs = true ...');
    if (uncompressedData.length >= 5344) {
      uncompressedData.writeInt32LE(-1, 5340);
    }
  }

  const lowerName = entry.name.toLowerCase();
  const mustStoreUncompressed =
    lowerName === 'resources.arsc' ||
    lowerName.endsWith('.arsc') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.webp');

  let finalMethod = 8;
  let finalCompData = null;

  if (mustStoreUncompressed) {
    finalMethod = 0;
    finalCompData = uncompressedData;
  } else {
    const deflated = zlib.deflateRawSync(uncompressedData, { level: 9 });
    if (deflated.length >= uncompressedData.length) {
      finalMethod = 0;
      finalCompData = uncompressedData;
    } else {
      finalMethod = 8;
      finalCompData = deflated;
    }
  }

  // Recalculate CRC32
  const entryCrc32 = calcCrc32(uncompressedData);
  const nameBuf = Buffer.from(entry.name, 'utf8');

  // Write Local File Header
  const newLfh = Buffer.alloc(30);
  newLfh.writeUInt32LE(0x04034b50, 0);
  newLfh.writeUInt16LE(20, 4); // version needed
  newLfh.writeUInt16LE(0, 6); // flags
  newLfh.writeUInt16LE(finalMethod, 8);
  newLfh.writeUInt16LE(entry.time, 10);
  newLfh.writeUInt16LE(entry.date, 12);
  newLfh.writeUInt32LE(entryCrc32, 14);
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
    name: entry.name,
    method: finalMethod,
    time: entry.time,
    date: entry.date,
    crc32: entryCrc32,
    compSize: finalCompData.length,
    uncompSize: uncompressedData.length,
    localOffset: currentLocalOffset
  });
}

// Close source FDs
for (const p in fdMap) {
  fs.closeSync(fdMap[p]);
}

// Write Central Directory
const cdStartOffset = outOffset;
for (const cd of newCdEntries) {
  const cdRecord = Buffer.alloc(46);
  cdRecord.writeUInt32LE(0x02014b50, 0);
  cdRecord.writeUInt16LE(20, 4); // version made by
  cdRecord.writeUInt16LE(20, 6); // version needed
  cdRecord.writeUInt16LE(0, 8); // flags
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
newEocd.writeUInt16LE(0, 4);
newEocd.writeUInt16LE(0, 6);
newEocd.writeUInt16LE(newCdEntries.length, 8);
newEocd.writeUInt16LE(newCdEntries.length, 10);
newEocd.writeUInt32LE(newCdSize, 12);
newEocd.writeUInt32LE(cdStartOffset, 16);
newEocd.writeUInt16LE(0, 20);

fs.writeSync(outFd, newEocd);
fs.closeSync(outFd);

console.log('Unaligned APK created successfully.');

// 1. Zipalign (4-byte alignment of uncompressed assets and SOs)
const zipalignExe = 'D:/Android/sdk/build-tools/36.0.0/zipalign.exe';
const apksignerBat = 'D:/Android/sdk/build-tools/36.0.0/apksigner.bat';
const keystorePath = path.resolve(__dirname, '../freshmart.keystore');
const javaHome = 'D:/jdk-17/jdk-17.0.21+9';

console.log('Running zipalign...');
if (fs.existsSync(alignedPath)) fs.unlinkSync(alignedPath);
execSync(`"${zipalignExe}" -p -f 4 "${unalignedPath}" "${alignedPath}"`, { stdio: 'inherit' });

// 2. Apksigner with --min-sdk-version 21 and v1 + v2 + v3
console.log('Signing APK with apksigner (v1 + v2 + v3 schemes)...');
const signCmd = `set JAVA_HOME=${javaHome}&& "${apksignerBat}" sign --ks "${keystorePath}" --ks-pass pass:freshmart123 --ks-key-alias freshmart --key-pass pass:freshmart123 --min-sdk-version 21 --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "${alignedPath}"`;
execSync(signCmd, { stdio: 'inherit', shell: 'cmd.exe' });

// 3. Verify signature
console.log('Verifying APK signature...');
const verifyCmd = `set JAVA_HOME=${javaHome}&& "${apksignerBat}" verify -v "${alignedPath}"`;
execSync(verifyCmd, { stdio: 'inherit', shell: 'cmd.exe' });

// 5. Distribute to public/downloads and dist/downloads
const pubDownloads = path.resolve(__dirname, '../public/downloads');
const distDownloads = path.resolve(__dirname, '../dist/downloads');
fs.mkdirSync(pubDownloads, { recursive: true });
fs.mkdirSync(distDownloads, { recursive: true });

fs.copyFileSync(alignedPath, path.join(pubDownloads, 'freshmart-staff.apk'));
fs.copyFileSync(alignedPath, path.join(pubDownloads, 'freshmart-customer.apk'));
if (fs.existsSync(distDownloads)) {
  fs.copyFileSync(alignedPath, path.join(distDownloads, 'freshmart-staff.apk'));
  fs.copyFileSync(alignedPath, path.join(distDownloads, 'freshmart-customer.apk'));
}

const finalStat = fs.statSync(alignedPath);
console.log(`✅ Successfully generated, zip-aligned, and multi-scheme signed APKs! Size: ${(finalStat.size / (1024*1024)).toFixed(2)} MB`);
