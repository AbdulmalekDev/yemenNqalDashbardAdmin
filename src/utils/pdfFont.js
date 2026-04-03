import { pdfMakeVfs } from './vfs_fonts';

export const customFonts = {
  Cairo: {
    normal: "Cairo-Regular.ttf",
    bold: "Cairo-Bold.ttf",
    italics: "Cairo-Regular.ttf",
    bolditalics: "Cairo-Bold.ttf"
  }
};

export const customVfs = pdfMakeVfs;

export const setupPdfMakeFonts = async () => {
  // We no longer need to fetch fonts because they are statically bundled now!
  return true;
};