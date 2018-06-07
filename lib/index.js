'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var lruCache = _interopDefault(require('lru-cache'));
var Jimp = _interopDefault(require('jimp'));
var dataUriToBuffer = _interopDefault(require('data-uri-to-buffer'));
var QRCode = _interopDefault(require('qrcode'));
var path = _interopDefault(require('path'));

// import {wallet} from '@cityofzion/neon-js';

function generateUri(address, properties) {
	// if (!address || !wallet.isAddress(address)) {
	if (!address) {
		return;
	}

	let output = `neo:${address}`;
	if (properties) {
		output += serializeQuery(properties);
	}

	return output;
}

function serializeQuery(query) {

	const parameters = Object.keys(query).reduce((accum, key) => {
		const value = query[key];
		accum.push(`${key}=${value}`);
		return accum;
	}, []);

	return parameters.length ? `?${parameters.join('&')}` : '';
}

const STATUS = {
  initialized: 'initialized',
  fetching: 'fetching',
  fetched: 'fetched',
  fetchFailed: 'fetch failed'
};

class CacheItem {
  constructor(opts) {
    this.key = opts.key;
    this.value = opts.value;
    this.fetchFunction = opts.fetchFunction;
    this.init();
  }

  init(status = STATUS.initialized) {
    this.status = status;
    this.resolvers = [];
    this.rejectors = [];
    return this.rejectors;
  }

  fetch() {
    return Promise.resolve().then(() => {
      if (this.status === STATUS.fetchFailed) {
        this.init();
      }
      if (this.status === STATUS.fetched || !this.fetchFunction) {
        // Return the current value
        return this.value;
      }
      // Add a promise to the list of promises awaiting fetch completion
      const p = new Promise((resolve, reject) => {
        this.resolvers.push(resolve);
        return this.rejectors.push(reject);
      });
      if (this.status === STATUS.initialized) {
        // Call the fetch function
        this.status = STATUS.fetching;
        Promise.resolve().then(() => this.fetchFunction(this.key)).then(value => {
          this.value = value;
          this.status = STATUS.fetched;
          const ref = this.resolvers;
          const results = [];
          for (let i = 0, len = ref.length; i < len; i++) {
            const r = ref[i];
            results.push(r(value));
          }
          this.init(this.status);
          return results;
        }).catch(err => {
          this.status = STATUS.fetchFailed;
          const ref = this.rejectors;
          const results = [];
          for (let i = 0, len = ref.length; i < len; i++) {
            const r = ref[i];
            results.push(r(err));
          }
          this.init(this.status);
          return results;
        });
      }
      return p;
    });
  }
}

function cachePromise (opts) {
  const cache = lruCache(opts);
  cache.getAsync = function getAsync(key, fetchFunction) {
    let item;
    item = cache.get(key);
    if (item === undefined && fetchFunction) {
      // Create a new cache item
      item = new CacheItem({
        key,
        fetchFunction
      });
      cache.set(key, item);
    }
    if (!(item instanceof CacheItem)) {
      return Promise.resolve(item);
    }
    return item.fetch();
  };
  return cache;
}

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

function createImageFromDataUri(dataUri) {
  return new Promise(resolve => {
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

const cacheLogo = cachePromise();
const cacheLogoResized = cachePromise();

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
  console.log('getResizedLogo');
  if (ignoreCache) {
    return fetchLogo(src, isLocal).then(img => resizeSquared(img, w, h));
  }
  console.log('getResizedLogo, ignoreCache');
  const resizedLogoKey = `${w}x${h}-${src}`;
  return cacheLogoResized.getAsync(resizedLogoKey, asyncToGenerator(function* () {
    console.log('getResizedLogo, cacheLogoResized');
    const logoFullImg = yield cacheLogo.getAsync(src, function () {
      return fetchLogo(src, isLocal);
    });
    console.log('getResizedLogo, logoFullImg');
    return resizeSquared(logoFullImg.clone(), w, h);
  }));
}

function generate({ uri, logoUrl, qrCodeOptions, ratio }) {
  console.log('generate');
  return createQRCode(uri, qrCodeOptions).then(img => {
    console.log('createQRCode');
    return Promise.all([img, getResizedLogo({
      src: '../assets/blankSquare.png',
      w: Math.floor(img.bitmap.width / (ratio - 0.5)),
      h: Math.floor(img.bitmap.height / (ratio - 0.5)),
      isLocal: true
    }), getResizedLogo({
      src: logoUrl,
      w: Math.floor(img.bitmap.width / ratio),
      h: Math.floor(img.bitmap.height / ratio)
    })]).catch(err => {
      console.log('Promise.all', err);
      throw err;
    });
  }).then(data => {
    console.log('getResizedLogo & getResizedLogo');
    const img = data[0];
    const logoBg = data[1];
    const logo = data[2];
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
      console.log('getBuffer before');
      qrImg.getBuffer(Jimp.MIME_PNG, (err, buf) => {
        console.log('getBuffer after');
        if (err) return rej(err);
        console.log('getBuffer fine');
        return resolve(buf);
      });
    });
  });
}

module.exports = {
  generateUri,
  generateQrCode: generate
};
//# sourceMappingURL=index.js.map
