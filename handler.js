'use strict';

const neoQrCodeNode = require('./lib/index.js');

module.exports.hello = (event, context, callback) => {

  const maxAge = 31557600;
  const ratio = 3.5;
  const qrCodeOptions = {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 200,
  };

  const errorResponse = {
    statusCode: 404,
    headers: { 'Content-Type': 'text/plain' },
    body: 'Invalid URI parameters'
  };

  const address = 'AKcm7eABuW1Pjb5HsTwiq7iARSatim9tQ6';
  const properties = event.queryStringParameters;

  let uri = neoQrCodeNode.generateUri(address, properties);

  if (!uri) {
    callback(null, {
      statusCode: 404,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid URI parameters'
    });
  } else {
    console.log('nicktest', uri)
    const logoUrl = 'https://cdn.o3.network/img/nep5icons/NEO.png';

    const options = {
      uri,
      logoUrl,
      qrCodeOptions,
      ratio,
    };

    neoQrCodeNode.generateQrCode(options)
    .then(imgBuffer => {

      const response = {
        "isBase64Encoded": true,
        "statusCode": 200,
        "headers": { 'Content-Type': 'image/png' },
        "body": imgBuffer.toString('base64')
      }

      // const response = {
      //   statusCode: 200,
      //   headers: {
      //     'Content-Type': 'image/png',
      //     // 'Cache-Control': `public, max-age=${maxAge}`
      //   },
      //   body: imgBuffer.toString('base64'),
      //   isBase64Encoded: true
      // };

      callback(null, response);
    })
    .catch(err => {
      console.log('catch', err)
      callback(null, {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'error creating QR code'
      });
    });
  }
};
