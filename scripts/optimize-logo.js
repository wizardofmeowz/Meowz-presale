import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '../public/meowz-logo.png');
const outputPath = join(__dirname, '../public/meowz-wallet-logo.png');

// Process the image
sharp(inputPath)
  .resize(32, 32, { // Making it smaller for better clarity
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
  })
  .toBuffer()
  .then(buffer => {
    // Create a new image with padding
    return sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: buffer,
      gravity: 'center'
    }])
    .png()
    .toFile(outputPath);
  })
  .then(info => console.log('Created simple logo:', info))
  .catch(err => console.error('Error:', err));
