import Jimp from 'jimp';
import dataUriToBuffer from 'data-uri-to-buffer';
import QRCode from 'qrcode';
import path from 'path';
import cachePromise from './cache-promise';
import nep5 from './nep5';

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
  return Jimp.read(_logoPath)
  .catch(() => Jimp.read('https://cdn.o3.network/img/nep5icons/NEO.png'));
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

function getLogoUrl(asset) {
  if (!asset) {
    return 'https://cdn.o3.network/img/nep5icons/NEO.png';
  } else if (asset.toLowerCase() === 'neo' || asset.toLowerCase() === 'gas') {
    return `https://cdn.o3.network/img/nep5icons/${asset.toUpperCase()}.png`;
  } else {
    const symbol = nep5[asset] || 'NEO';
    return `https://cdn.o3.network/img/nep5icons/${symbol.toUpperCase()}.png`;
  }
}

export default function generate({uri, asset, qrCodeOptions, ratio}) {
  return createQRCode(uri, qrCodeOptions)
  .then(img => {
    return Promise.all([
      img,
      getResizedLogo({
        src: '../assets/blankSquare.png',
        w: Math.floor(img.bitmap.width / (ratio - 0.5)),
        h: Math.floor(img.bitmap.height / (ratio - 0.5)),
        isLocal: true,
      }),
      getResizedLogo({
        src: getLogoUrl(asset),
        w: Math.floor(img.bitmap.width / ratio),
        h: Math.floor(img.bitmap.height / ratio),
      }),
    ])
    .catch(err => {
      throw err
    })
  })
  .then(data => {
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
      qrImg.getBuffer(Jimp.MIME_PNG, (err, buf) => {
        if (err) return rej(err);
        return resolve(buf);
      });
    });
  });
}
