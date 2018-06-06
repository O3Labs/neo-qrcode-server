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

	var output = `neo:${address}`;
	if (properties) {
		output += serializeQuery(properties);
	}

	return output;
}

function serializeQuery(query) {

	var parameters = Object.keys(query).reduce(function (accum, key) {
		var value = query[key];
		accum.push(`${key}=${value}`);
		return accum;
	}, []);

	return parameters.length ? `?${parameters.join('&')}` : '';
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

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var STATUS = {
  initialized: 'initialized',
  fetching: 'fetching',
  fetched: 'fetched',
  fetchFailed: 'fetch failed'
};

var CacheItem = function () {
  function CacheItem(opts) {
    classCallCheck(this, CacheItem);

    this.key = opts.key;
    this.value = opts.value;
    this.fetchFunction = opts.fetchFunction;
    this.init();
  }

  createClass(CacheItem, [{
    key: 'init',
    value: function init() {
      var status = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : STATUS.initialized;

      this.status = status;
      this.resolvers = [];
      this.rejectors = [];
      return this.rejectors;
    }
  }, {
    key: 'fetch',
    value: function fetch() {
      var _this = this;

      return Promise.resolve().then(function () {
        if (_this.status === STATUS.fetchFailed) {
          _this.init();
        }
        if (_this.status === STATUS.fetched || !_this.fetchFunction) {
          // Return the current value
          return _this.value;
        }
        // Add a promise to the list of promises awaiting fetch completion
        var p = new Promise(function (resolve, reject) {
          _this.resolvers.push(resolve);
          return _this.rejectors.push(reject);
        });
        if (_this.status === STATUS.initialized) {
          // Call the fetch function
          _this.status = STATUS.fetching;
          Promise.resolve().then(function () {
            return _this.fetchFunction(_this.key);
          }).then(function (value) {
            _this.value = value;
            _this.status = STATUS.fetched;
            var ref = _this.resolvers;
            var results = [];
            for (var i = 0, len = ref.length; i < len; i++) {
              var r = ref[i];
              results.push(r(value));
            }
            _this.init(_this.status);
            return results;
          }).catch(function (err) {
            _this.status = STATUS.fetchFailed;
            var ref = _this.rejectors;
            var results = [];
            for (var i = 0, len = ref.length; i < len; i++) {
              var r = ref[i];
              results.push(r(err));
            }
            _this.init(_this.status);
            return results;
          });
        }
        return p;
      });
    }
  }]);
  return CacheItem;
}();

function cachePromise (opts) {
  var cache = lruCache(opts);
  cache.getAsync = function getAsync(key, fetchFunction) {
    var item = void 0;
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

function createImageFromDataUri(dataUri) {
  return new Promise(function (resolve) {
    new Jimp(dataUriToBuffer(dataUri), function (err, img) {
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
  return new Promise(function (resolve) {
    QRCode.toDataURL(uri, options, function (err, response) {
      if (err) throw err;
      resolve(createImageFromDataUri(response));
    });
  });
}

var cacheLogo = cachePromise();
var cacheLogoResized = cachePromise();

function fetchLogo(_logoPath, isLocal) {
  if (isLocal) {
    _logoPath = _logoPath[0] === '/' || _logoPath[0] === '\\' ? _logoPath : path.resolve(__dirname, _logoPath);
  }
  return Jimp.read(_logoPath);
}

function resizeSquared(img, _w, _h) {
  var w = void 0;
  var h = void 0;

  if (_h > _w) {
    w = Jimp.AUTO;
    h = _h;
  } else {
    w = _w;
    h = Jimp.AUTO;
  }
  return img.resize(w, h);
}

function getResizedLogo(_ref) {
  var _this = this;

  var src = _ref.src,
      w = _ref.w,
      h = _ref.h,
      _ref$ignoreCache = _ref.ignoreCache,
      ignoreCache = _ref$ignoreCache === undefined ? false : _ref$ignoreCache,
      isLocal = _ref.isLocal;

  if (ignoreCache) {
    return fetchLogo(src, isLocal).then(function (img) {
      return resizeSquared(img, w, h);
    });
  }

  var resizedLogoKey = `${w}x${h}-${src}`;
  return cacheLogoResized.getAsync(resizedLogoKey, asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var logoFullImg;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return cacheLogo.getAsync(src, function () {
              return fetchLogo(src, isLocal);
            });

          case 2:
            logoFullImg = _context.sent;
            return _context.abrupt('return', resizeSquared(logoFullImg.clone(), w, h));

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this);
  })));
}

function generate(_ref3) {
  var uri = _ref3.uri,
      logoUrl = _ref3.logoUrl,
      qrCodeOptions = _ref3.qrCodeOptions,
      ratio = _ref3.ratio;

  console.log('generate');
  return createQRCode(uri, qrCodeOptions).then(function (img) {
    console.log('createQRCode');
    return Promise.all([img, getResizedLogo({
      src: './assets/blankSquare.png',
      w: Math.floor(img.bitmap.width / (ratio - 0.5)),
      h: Math.floor(img.bitmap.height / (ratio - 0.5)),
      isLocal: true
    }), getResizedLogo({
      src: logoUrl,
      w: Math.floor(img.bitmap.width / ratio),
      h: Math.floor(img.bitmap.height / ratio)
    })]);
  }).then(function (data) {
    console.log('getResizedLogo & getResizedLogo');
    var img = data[0];
    var logoBg = data[1];
    var logo = data[2];
    // Center the logo bg
    var x_bg = Math.floor((img.bitmap.width - logoBg.bitmap.width) / 2);
    var y_bg = Math.floor((img.bitmap.height - logoBg.bitmap.height) / 2);

    var qrBgImg = img.composite(logoBg, x_bg, y_bg);

    // Center the logo
    var x = Math.floor((img.bitmap.width - logo.bitmap.width) / 2);
    var y = Math.floor((img.bitmap.height - logo.bitmap.height) / 2);

    // Apply on the QRCode
    var qrImg = qrBgImg.composite(logo, x, y);

    return new Promise(function (resolve, reject) {
      console.log('getBuffer before');
      qrImg.getBuffer(Jimp.MIME_PNG, function (err, buf) {
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
