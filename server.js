import express from 'express';
import { generateUri, generateQrCode } from './src'

const app = express();

const maxAge = 31557600;
const ratio = 3.5;
const qrCodeOptions = {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 200,
};

app.get('/:address', function (req, res) {
  const address = req.params.address;
	const properties = req.query;

	let uri = generateUri(address, properties);
  console.log(uri);

  if (!uri) {
    res.sendStatus(404);
  } else {

    const logoUrl = 'https://cdn.o3.network/img/nep5icons/NEO.png';

    const options = {
      uri,
      logoUrl,
      qrCodeOptions,
      ratio,
    };

    generateQrCode(options)
    .then(imgBuffer => {
      res.setHeader('Content-Type', 'image/png');
      if (maxAge !== false) res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      res.send(imgBuffer);
    })
    .catch(err => {
      res.sendStatus(404);
    });
  }
});

app.listen(3000, function () {
	console.log('ImageOptimizer listening on port 3000!');
});
