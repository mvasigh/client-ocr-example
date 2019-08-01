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

function App() {
  const [file, setFile] = useState();
  const [src, setSrc] = useState();
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
    getImageCropFromPdfPage(pageRef.current, pct).then(croppedImg => {
      // OCR the cropped image
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
