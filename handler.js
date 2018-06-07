'use strict';

const neoQrCodeNode = require('./lib/index.js');

module.exports.generateNEP9 = (event, context, callback) => {

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

  const address = event.pathParameters.address;
  const properties = event.queryStringParameters;
  const asset = properties && properties.asset;

  let uri = neoQrCodeNode.generateUri(address, properties);

  if (!uri) {
    callback(null, {
      statusCode: 404,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid URI parameters'
    });
  } else {
    console.log(uri)

    const options = {
      uri,
      asset,
      qrCodeOptions,
      ratio,
    };

    neoQrCodeNode.generateQrCode(options)
    .then(imgBuffer => {

      const response = {
        "isBase64Encoded": true,
        "statusCode": 200,
        "headers": {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000'
        },
        "body": imgBuffer.toString('base64')
      }

      callback(null, response);
    })
    .catch(err => {
      console.log('QR Code create error', err)
      callback(null, {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'error creating QR code'
      });
    });
  }
};
