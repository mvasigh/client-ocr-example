import React, { useState, useRef, useEffect } from 'react';
import { render } from 'react-dom';
import {
  readFile,
  getPdfFromFile,
  getImageFromPdfPage,
  getSvgFromPdfPage,
  getImageCropFromPdfPage
} from './pdf-util';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { TesseractWorker } from 'tesseract.js';

const worker = new TesseractWorker();

function App() {
  const [file, setFile] = useState();
  const [src, setSrc] = useState();
  const [croppedSrc, setCroppedSrc] = useState();
  const [crop, setCrop] = useState({
    unit: '%',
    width: 30
  });
  const pageRef = useRef();

  const handleFileChange = e => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    if (!file) return;
    readFile(file)
      .then(fileArr => getPdfFromFile(fileArr))
      .then(pdf => pdf.getPage(1))
      .then(page => {
        pageRef.current = page;
        getImageFromPdfPage(page).then(image => setSrc(image));
      });
  }, [file]);

  const handleComplete = (px, pct) => {
    if (!pageRef.current) return;
    if (!pct.width || !pct.height) return;
    getImageCropFromPdfPage(pageRef.current, pct).then(croppedImg => {
      setCroppedSrc(croppedImg)
      worker
        .recognize(croppedImg)
        .progress(progress => {
          console.log('progress', progress);
        })
        .then(result => {
          console.log('result', result);
        });
    });
  };

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100vw'
      }}
    >
      <h1>Localized OCR example with Tesseract.js</h1>
      <form>
        <input type="file" onChange={handleFileChange}></input>
      </form>
      {croppedSrc && (
        <img src={croppedSrc} alt="Cropped Image" />
      )}
      {src && (
        <ReactCrop
          style={{
            maxWidth: '100vw'
          }}
          src={src}
          crop={crop}
          onImageLoaded={() => {}}
          onComplete={handleComplete}
          onChange={crop => setCrop(crop)}
        />
      )}
    </div>
  );
}

render(<App />, document.getElementById('app'));
