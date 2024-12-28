const sharp = require('sharp');
const { encode } = require('blurhash');
const path = require('path');
const fs = require('fs');

async function encodeImageToBlurhash(filePath) {
  try {
    // Read the image file with sharp
    const imageData = await sharp(filePath)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' }) // Resize to something reasonable for BlurHash
      .toBuffer();

    // Get the width and height from the image metadata
    const { width, height } = await sharp(filePath).metadata();

    // Generate the BlurHash
    const blurhash = encode(new Uint8ClampedArray(imageData), width, height, 4, 4);

    // Convert to base64
    const base64Image = toBase64(blurhash);

    return base64Image;
  } catch (error) {
    console.error('Error generating BlurHash', error);
    throw error;
  }
}

// Helper function to convert BlurHash to base64
const toBase64 = (blurhash) => {
  const digits =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{}~";
  const blurhashLength = blurhash.length;
  const bytesPerRow = Math.ceil((blurhashLength * 3) / 4);
  const output = new Uint8Array(blurhashLength);

  for (let i = 0; i < blurhashLength; i++) {
    const c = blurhash[i];
    const value = digits.indexOf(c);
    if (value === -1) {
      throw new Error("Invalid character in blurhash string");
    }
    output[i] = (value << 2) ((digits.indexOf(blurhash[i + 1]) >> 4) & 0x3);
  }

  return Buffer.from(output).toString('base64');
};
