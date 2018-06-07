'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var lruCache = _interopDefault(require('lru-cache'));
var Jimp = _interopDefault(require('jimp'));
var dataUriToBuffer = _interopDefault(require('data-uri-to-buffer'));
var QRCode = _interopDefault(require('qrcode'));
var path = _interopDefault(require('path'));

function generateUri(address, properties) {
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

var nep5 = {
  "7f86d61ff377f1b12e589a5907152b57e2ad9a7a": "ACAT",
  "a0777c3ce2b169d4a23bcba4565e3225a0122d95": "APH",
  "7cd338644833db2fd8824c410e364890d179e6f8": "APT",
  "a58b56b30425d3d1f8902034996fcac4168ef71d": "ASA",
  "546c5872a992b2754ef327154f4c119baabff65f": "BCS",
  "891daf0e1750a1031ebe23030828ad7781d874d6": "IAM",
  "34579e4614ac1a7bd295372d3de8621770c76cdc": "CGE",
  "45d493a6f73fa5f404244a5fb8472fc014ca5885": "CPX",
  "b951ecbbc5fe37a9c280a76cb0ce0014827294cf": "DBC",
  "81c089ab996fc89c468a26c0a88d23ae2f34b5c0": "EDS",
  "acbc532904b6b51b5ea6d19b803d78af70e7e6f9": "EFX",
  "e8f98440ad0d7a6e76d84fb1c3d3f8a16e162e97": "EXT",
  "d1e37547d88bc9607ff9d73116ebd9381c156f79": "GDM",
  "9577c3f972d769220d69d1c4ddbd617c44d067aa": "GALA",
  "06fa8be9b6609d963e8fc63977b9f8dc5f10895f": "LRN",
  "a87cc2a513f5d8b4a42432343687c2127c60bc3f": "MCT",
  "c36aee199dbba6c3f439983657558cfb67629599": "NKN",
  "a721d5893480260bd28ca1f395f2c465d0b5b1c2": "NRVE",
  "ceab719b8baa2310f232ee0d277c061704541cfb": "ONT",
  "0e86a40588f715fcaf7acd1812d50af478e6e917": "OBT",
  "ed07cffad18f1308db51920d99a2af60ac66a7b3": "SOUL",
  "af7c7328eee5a275a3bcaee2bf0cf662b5e739be": "PKC",
  "0d821bd7b6d53f5c2b40e217c6defc8bbe896cf5": "QLC",
  "ecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9": "RPX",
  "2328008e6f6c7bd157a342e789389eb034d9cbc4": "RHT",
  "ab38352559b8b203bde5fddfa0b07d8b2525e132": "SWTH",
  "78e6d16b914fe15bc16150aeb11d0c2a8e532bdd": "SWH",
  "132947096727c84c7f9e076c90f08fec3bc17f18": "TKY",
  "67a5086bac196b67d5fd20745b0dc9db4d2930ed": "THOR",
  "de2ed49b691e76754c20fe619d891b78ef58e537": "AVA",
  "08e8c4400f1af2c20c28e0018f29535eb85d15b6": "TNC",
  "40bb36a54bf28872b6ffdfa7fbc6480900e58448": "WWB",
  "6eca2c4bd2b3ed97b2aa41b26128a40ce2bd8d1a": "XQTA",
  "ac116d4b8d4ca55e6b6d4ecce2192039b51cccc5": "ZPT"
};

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
  return Jimp.read(_logoPath).catch(() => Jimp.read('https://cdn.o3.network/img/nep5icons/NEO.png'));
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
  return cacheLogoResized.getAsync(resizedLogoKey, asyncToGenerator(function* () {
    const logoFullImg = yield cacheLogo.getAsync(src, function () {
      return fetchLogo(src, isLocal);
    });
    return resizeSquared(logoFullImg.clone(), w, h);
  }));
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

function generate({ uri, asset, qrCodeOptions, ratio }) {
  return createQRCode(uri, qrCodeOptions).then(img => {
    return Promise.all([img, getResizedLogo({
      src: '../assets/blankSquare.png',
      w: Math.floor(img.bitmap.width / (ratio - 0.5)),
      h: Math.floor(img.bitmap.height / (ratio - 0.5)),
      isLocal: true
    }), getResizedLogo({
      src: getLogoUrl(asset),
      w: Math.floor(img.bitmap.width / ratio),
      h: Math.floor(img.bitmap.height / ratio)
    })]).catch(err => {
      throw err;
    });
  }).then(data => {
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
      qrImg.getBuffer(Jimp.MIME_PNG, (err, buf) => {
        if (err) return rej(err);
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
