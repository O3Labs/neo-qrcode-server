# NEO NEP 9 QR Code Server(less)
This is a dynamic PNG image service for creating NEO NEP9 compliant QR codes. The service runs is meant to run on AWS lambdas with serverless.

The image service url format is exact to the NEP9 standard, and replaces the `neo:` prefix with `https://nep9.o3.network/`. You can provide any combination of address and parameters to the service, and it will return a PNG image resource back to you.

This service is meant to be used wherever any of the available packages are not able to be run, or you would like to easily share these QR codes over chat of social media.

## Address only example:
```
https://nep9.o3.network/AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB
```

Will return you the QR code containing the NEP9 formatted URI:
```
neo:AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB
```
![img](https://nep9.o3.network/AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB)

## Address and asset example
NEO and GAS can be written as shorthand symbols, where as NEP5 tokens must be specified as their assetIDs (contract hash)
```
https://nep9.o3.network/AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB?asset=ceab719b8baa2310f232ee0d277c061704541cfb
```

Will return you the QR code containing the NEP9 formatted URI:
```
neo:AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB?asset=ceab719b8baa2310f232ee0d277c061704541cfb
```
![img](https://nep9.o3.network/AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB?asset=ceab719b8baa2310f232ee0d277c061704541cfb)

## Address, asset, and amount example
```
https://nep9.o3.network/AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB?asset=gas&amount=3.33333
```

Will return you the QR code containing the NEP9 formatted URI:
```
neo:AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB?asset=gas&amount=3.33333
```
![img](https://nep9.o3.network/AR8rRBxgWw5siKsp1dUmfTLy6QQTjcqoqB?asset=gas&amount=3.33333)

# Installation
```
npm install
```

# Build
Compile the library from `/src` to `/lib/index.js`
```
npm run build
```

# Deploy
Assuming you already have[ serverless installed](https://serverless.com/framework/docs/providers/aws/guide/installation/) and [configured with AWS](https://serverless.com/framework/docs/providers/aws/guide/credentials#setup-with-serverless-config-credentials-command)
```
serverless deploy
```
