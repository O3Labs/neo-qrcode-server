import Jimp from 'jimp';
import dataUriToBuffer from 'data-uri-to-buffer';
import QRCode from 'qrcode';
import path from 'path';
import cachePromise from './cache-promise';

function createImageFromDataUri(dataUri) {
  return new Promise((resolve) => {
    new Jimp(dataUriToBuffer(dataUri), (err, img) => {
      if (err) throw err;
      resolve(img);
    });
  });
}

function createQRCode(uri, options) {
  // FIXME: it works. But it could be more efficient.
  // The npm qrcode module cannot output just a buffer.
  // So we need to pass through base64 encoding.
  // To fix this, we need to create a PR on qrcode to support output as a buffer.
  return new Promise(resolve => {
    QRCode.toDataURL(uri, options, (err, response) => {
      if (err) throw err;
      resolve(createImageFromDataUri(response));
    });
  });
}

export const cacheLogo = cachePromise();
export const cacheLogoResized = cachePromise();

function fetchLogo(_logoPath, isLocal) {
  if (isLocal) {
    _logoPath = _logoPath[0] === '/' || _logoPath[0] === '\\' ? _logoPath : path.resolve(__dirname, _logoPath);
  }
  return Jimp.read(_logoPath);
}

function resizeSquared(img, _w, _h) {
  let w;
  let h;

  if (_h > _w) {
    w = Jimp.AUTO;
    h = _h;
  } else {
    w = _w;
    h = Jimp.AUTO;
  }
  return img.resize(w, h);
}

function getResizedLogo({
  src, w, h, ignoreCache = false, isLocal
}) {
  if (ignoreCache) {
    return fetchLogo(src, isLocal).then(img => resizeSquared(img, w, h));
  }

  const resizedLogoKey = `${w}x${h}-${src}`;
  return cacheLogoResized.getAsync(resizedLogoKey, async () => {
    const logoFullImg = await cacheLogo.getAsync(src, () => fetchLogo(src, isLocal));
    return resizeSquared(logoFullImg.clone(), w, h);
  });
}

export default function generate({uri, logoUrl, qrCodeOptions, ratio}) {
  console.log('generate')
  return createQRCode(uri, qrCodeOptions)
  .then(img => {
    console.log('createQRCode')
    return Promise.all([
      img,
      getResizedLogo({
        src: './assets/blankSquare.png',
        w: Math.floor(img.bitmap.width / (ratio - 0.5)),
        h: Math.floor(img.bitmap.height / (ratio - 0.5)),
        isLocal: true,
      }),
      getResizedLogo({
        src: logoUrl,
        w: Math.floor(img.bitmap.width / ratio),
        h: Math.floor(img.bitmap.height / ratio),
      }),
    ])
  })
  .then(data => {
    console.log('getResizedLogo & getResizedLogo')
    const img = data[0]
    const logoBg = data[1]
    const logo = data[2]
    // Center the logo bg
    const x_bg = Math.floor((img.bitmap.width - logoBg.bitmap.width) / 2);
    const y_bg = Math.floor((img.bitmap.height - logoBg.bitmap.height) / 2);

    const qrBgImg = img.composite(logoBg, x_bg, y_bg);

    // Center the logo
    const x = Math.floor((img.bitmap.width - logo.bitmap.width) / 2);
    const y = Math.floor((img.bitmap.height - logo.bitmap.height) / 2);

    // Apply on the QRCode
    const qrImg = qrBgImg.composite(logo, x, y);

    return new Promise((resolve, reject) => {
      console.log('getBuffer before')
      qrImg.getBuffer(Jimp.MIME_PNG, (err, buf) => {
        console.log('getBuffer after')
        if (err) return rej(err);
        console.log('getBuffer fine')
        return resolve(buf);
      });
    });
  });
}