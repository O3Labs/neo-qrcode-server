import {wallet} from '@cityofzion/neon-js';

export function generateUri(address, properties) {
	if (!address || !wallet.isAddress(address)) {
  	return;
	}

  return `neo:${address}${serializeQuery(properties)}`;
}

function serializeQuery(query) {

	const parameters = Object.keys(query).reduce((accum, key) => {
    const value = query[key];
    accum.push(`${key}=${value}`);
    return accum;
  }, []);

	return parameters.length && `?${parameters.join('&')}`;
}
