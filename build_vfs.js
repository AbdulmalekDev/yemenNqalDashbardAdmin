import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.resolve(__dirname, 'public/fonts');
const outputPath = path.resolve(__dirname, 'src/utils/vfs_fonts.js');

try {
  const regularBuffer = fs.readFileSync(path.join(fontsDir, 'Cairo-Regular.ttf'));
  const boldBuffer = fs.readFileSync(path.join(fontsDir, 'Cairo-Bold.ttf'));

  const vfs = {
    "Cairo-Regular.ttf": regularBuffer.toString('base64'),
    "Cairo-Bold.ttf": boldBuffer.toString('base64')
  };

  const fileContent = `// Auto-generated VFS for Arabic Fonts
export const pdfMakeVfs = ${JSON.stringify(vfs, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent);
  console.log("SUCCESS: vfs_fonts.js generated at " + outputPath);
} catch (error) {
  console.error("ERROR generating VFS:", error);
}
