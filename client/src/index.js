import React, { useState, useRef, useEffect, useReducer } from 'react';
import { render } from 'react-dom';
import {
  readFile,
  getPdfFromFile,
  getImageFromPdfPage,
  getImageCropFromPdfPage
} from './pdf-util';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { TesseractWorker } from 'tesseract.js';
import axios from 'axios';

const worker = new TesseractWorker();

const CLIENT_BACKEND_URL = process.env.CLIENT_BACKEND_URL || '/api';

function fetchOcrResults(imageUri) {
  return axios
    .post(`${CLIENT_BACKEND_URL}/ocr`, { imageUri })
    .then(({ data }) => console.log(data) || data);
}

function transformGoogleResults(results) {
  return results
    .filter(result => result.locale === 'und')
    .map(result => result.description);
}

function transformTesseractResults(results) {
  return results.words.map(word => word.text);
}

const initialState = {
  croppedSrc: null,
  src: null,
  file: null,
  crop: {
    unit: '%',
    width: 30
  },
  tesseractResults: [],
  googleResults: []
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload };
    case 'SET_SRC':
      return { ...state, src: action.payload };
    case 'SET_CROPPED_SRC':
      return { ...state, croppedSrc: action.payload };
    case 'SET_TESSERACT_RESULTS':
      return { ...state, tesseractResults: action.payload };
    case 'SET_GOOGLE_RESULTS':
      return { ...state, googleResults: action.payload };
    case 'RESET_RESULTS':
      return { ...state, tesseractResults: [], googleResults: [] };
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 30
  });
  const pageRef = useRef();

  const handleFileChange = e => {
    dispatch({ type: 'SET_FILE', payload: e.target.files[0] });
  };

  useEffect(() => {
    if (!state.file) return;
    readFile(state.file)
      .then(fileArr => getPdfFromFile(fileArr))
      .then(pdf => pdf.getPage(1))
      .then(page => {
        pageRef.current = page;
        getImageFromPdfPage(page).then(image =>
          dispatch({ type: 'SET_SRC', payload: image })
        );
      });
  }, [state.file]);

  const handleComplete = (px, pct) => {
    if (!pageRef.current) return;
    if (!pct.width || !pct.height) return;
    dispatch({ type: 'RESET_RESULTS' });
    getImageCropFromPdfPage(pageRef.current, pct).then(croppedImg => {
      dispatch({ type: 'SET_CROPPED_SRC', payload: croppedImg });
      worker
        .recognize(croppedImg)
        .progress(progress => {
          console.log('progress', progress);
        })
        .then(result => transformTesseractResults(result))
        .then(transformedResults =>
          dispatch({
            type: 'SET_TESSERACT_RESULTS',
            payload: transformedResults
          })
        );
      fetchOcrResults(croppedImg)
        .then(results => transformGoogleResults(results))
        .then(transformedResults =>
          dispatch({
            type: 'SET_GOOGLE_RESULTS',
            payload: transformedResults
          })
        );
    });
  };

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100vw'
      }}
    >
      <h1>Localized OCR example</h1>
      <form>
        <input type="file" onChange={handleFileChange}></input>
      </form>
      {state.croppedSrc && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <img src={state.croppedSrc} alt="Cropped Image" />
          <ul>
            <li>
              Tesseract:{' '}
              {state.tesseractResults.length
                ? state.tesseractResults.join(', ')
                : 'Loading...'}
            </li>
            <li>
              Google:{' '}
              {state.googleResults.length
                ? state.googleResults.join(', ')
                : 'Loading...'}
            </li>
          </ul>
        </div>
      )}
      {state.src && (
        <ReactCrop
          style={{
            maxWidth: '100vw'
          }}
          src={state.src}
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
