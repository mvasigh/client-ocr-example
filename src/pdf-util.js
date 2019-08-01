import pdfjs from 'pdfjs-dist';

// temporarily using a CDN for the worker until we figure out webpack mess
pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.1.266/pdf.worker.js';

const MAX_DIMENSION_LENGTH = 6000;

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function() {
      resolve(reader.result);
    };

    reader.readAsArrayBuffer(file);
  });
}

export function getPdfFromFile(fileArr) {
  return pdfjs.getDocument(fileArr).promise;
}

// returns a Promise that resolves to base64 encoded png
export async function getImageFromPdfPage(page, scaleArg) {
  // get width and height dimensions from page
  const [, , w, h] = page.view;
  // get scale based on max length
  const scale = scaleArg || MAX_DIMENSION_LENGTH / Math.max(w, h);
  const viewport = page.getViewport(scale);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport
  };

  // return page.render(renderContext).then(() => canvas.toDataURL())
  await page.render(renderContext);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        //reject(new Error('Canvas is empty'));
        console.error('Canvas is empty');
        return;
      }
      blob.name = 'Diagram';
      const fileUrl = window.URL.createObjectURL(blob);
      resolve(fileUrl);
    }, 'image/jpeg');
  });
}

export async function getImageCropFromPdfPage(page, { x, y, width, height }) {
  // get width and height dimensions from page
  const [, , w, h] = page.view;
  // get scale based on max length
  const scale = 10;
  const viewport = page.getViewport(scale);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport
  };

  await page.render(renderContext);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = (width / 100) * canvas.width;
  cropCanvas.height = (height / 100) * canvas.height;

  const ctx = cropCanvas.getContext('2d');
  ctx.drawImage(
    canvas,
    (x / 100) * canvas.width,
    (y / 100) * canvas.height,
    (width / 100) * canvas.width,
    (height / 100) * canvas.height,
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height
  );
  return cropCanvas.toDataURL();

  //  return new Promise((resolve, reject) => {
  //    canvas.toBlob(blob => {
  //      if (!blob) {
  //        //reject(new Error('Canvas is empty'));
  //        console.error('Canvas is empty');
  //        return;
  //      }
  //      blob.name = 'Diagram';
  //      const fileUrl = window.URL.createObjectURL(blob);
  //      resolve(fileUrl);
  //    }, 'image/jpeg');
  //  });
}

// export async function getSvgFromPdfPage(page) {
//   const viewport = page.getViewport(1.0);
//   const svgGfx = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
//   svgGfx.embedFonts = true;
//   const operatorList = await page.getOperatorList();
//   const svg = await svgGfx.getSVG(operatorList, viewport);
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     // get svg data
//     const xml = new XMLSerializer().serializeToString(svg);

//     // make it base64
//     const svg64 = btoa(xml);
//     const b64Start = 'data:image/svg+xml;base64,';

//     // prepend a "header"
//     const image64 = b64Start + svg64;
//     img.src = image64
//     img.onload = () => resolve(img);
//     img.onerror = e => reject(e);
//   });
// }
