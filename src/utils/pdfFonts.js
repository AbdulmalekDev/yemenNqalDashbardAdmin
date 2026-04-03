import pdfMake from "pdfmake/build/pdfmake";

/**
 * Dynamic Arabic Font Loader for pdfmake 0.3.x
 * Loads full Amiri fonts (~420KB) at runtime via fetch.
 * These fonts contain complete Arabic GSUB/GPOS tables for proper shaping.
 */

let fontsLoaded = false;

const FONT_URLS = {
  'Amiri-Regular.ttf': '/Amiri-Regular.ttf',
  'Amiri-Bold.ttf': '/Amiri-Bold.ttf',
};

const FONT_DESCRIPTOR = {
  Amiri: {
    normal: 'Amiri-Regular.ttf',
    bold: 'Amiri-Bold.ttf',
    italics: 'Amiri-Regular.ttf',
    bolditalics: 'Amiri-Bold.ttf',
  }
};

/**
 * Fetches a font file and returns it as an ArrayBuffer
 */
async function fetchFont(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${url} (${response.status})`);
  }
  return await response.arrayBuffer();
}

/**
 * Loads and registers Amiri fonts into pdfmake's VFS.
 * Uses caching to avoid re-fetching on subsequent calls.
 */
export async function loadArabicFonts() {
  if (fontsLoaded) return;

  const pdfInstance = pdfMake.default || pdfMake;

  // Fetch both fonts in parallel
  const [regularBuffer, boldBuffer] = await Promise.all([
    fetchFont(FONT_URLS['Amiri-Regular.ttf']),
    fetchFont(FONT_URLS['Amiri-Bold.ttf']),
  ]);

  // Inject into pdfmake's internal VirtualFileSystem as Uint8Array
  if (pdfInstance.virtualfs && typeof pdfInstance.virtualfs.writeFileSync === 'function') {
    pdfInstance.virtualfs.writeFileSync('Amiri-Regular.ttf', new Uint8Array(regularBuffer));
    pdfInstance.virtualfs.writeFileSync('Amiri-Bold.ttf', new Uint8Array(boldBuffer));
  }

  // Also set on pdfMake.vfs for compatibility
  const toBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  pdfInstance.vfs = pdfInstance.vfs || {};
  pdfInstance.vfs['Amiri-Regular.ttf'] = toBase64(regularBuffer);
  pdfInstance.vfs['Amiri-Bold.ttf'] = toBase64(boldBuffer);

  // Register font descriptor
  if (typeof pdfInstance.setFonts === 'function') {
    pdfInstance.setFonts(FONT_DESCRIPTOR);
  } else {
    pdfInstance.fonts = FONT_DESCRIPTOR;
  }

  // Global registration for safety
  if (typeof window !== 'undefined') {
    window.pdfMake = window.pdfMake || pdfInstance;
    window.pdfMake.vfs = pdfInstance.vfs;
    window.pdfMake.fonts = FONT_DESCRIPTOR;
  }

  fontsLoaded = true;
  console.log('PDF Fonts: Amiri loaded successfully');
}

export { FONT_DESCRIPTOR };
