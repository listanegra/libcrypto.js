const libcrypto = require('../../libcrypto');

const {
    Uint8ArrayToUint32Array,
} = require('./_internal_buffer');
const {
    _heap_malloc,
    _heap_utf8_string,
    _heap_free,
} = require('./_internal_heap');

const OSSL_MAC_PARAM_CIPHER = 'cipher';
const OSSL_MAC_PARAM_DIGEST = 'digest';

const _MAC_NAME_MAP = {
    'hmac': 'HMAC',
    'cmac': 'CMAC',
};

const _MAC_PARAM_MAP = {
    'HMAC': OSSL_MAC_PARAM_DIGEST,
    'CMAC': OSSL_MAC_PARAM_CIPHER,
};

const _MAC_ALGORITHM_MAP = {
    'HMAC': {
        'md5': 'MD5',
        'sha-1': 'SHA1',
        'sha-224': 'SHA224',
        'sha-256': 'SHA256',
        'sha-384': 'SHA384',
        'sha-512': 'SHA512',
        'sha3-224': 'SHA3-224',
        'sha3-256': 'SHA3-256',
        'sha3-384': 'SHA3-384',
        'sha3-512': 'SHA3-512',
    },
    'CMAC': {
        'aes-128-cbc': 'AES-128-CBC',
        'aes-192-cbc': 'AES-192-CBC',
        'aes-256-cbc': 'AES-256-CBC',
    },
};

const AES_128_KEY_LENGTH = 16;
const AES_192_KEY_LENGTH = 24;
const AES_256_KEY_LENGTH = 32;

const _MAC_CIPHER_KEY_LENGTH = {
    'AES-128-CBC': AES_128_KEY_LENGTH,
    'AES-192-CBC': AES_192_KEY_LENGTH,
    'AES-256-CBC': AES_256_KEY_LENGTH,
};

class Mac {

    constructor(name, algorithm, key) {
        const _ossl_ctx = libcrypto._OSSL_LIB_CTX_get0_global_default();

        if (!_ossl_ctx) {
            throw new Error('Unable to get OpenSSL context');
        }

        const _name = _heap_utf8_string(name);
        const _evp_mac = libcrypto._EVP_MAC_fetch(_ossl_ctx, _name.byteOffset, 0);
        this._evp_mac_ctx = libcrypto._EVP_MAC_CTX_new(_evp_mac);

        const _algorithm = _heap_utf8_string(algorithm);
        const _ossl_mac_param_key = _heap_utf8_string(_MAC_PARAM_MAP[name]);

        const _ossl_param_bld = libcrypto._OSSL_PARAM_BLD_new();
        libcrypto._OSSL_PARAM_BLD_push_utf8_string(
            _ossl_param_bld,
            _ossl_mac_param_key.byteOffset,
            _algorithm.byteOffset,
            _algorithm.byteLength,
        );

        const _ossl_param = libcrypto._OSSL_PARAM_BLD_to_param(_ossl_param_bld);
        libcrypto._OSSL_PARAM_BLD_free(_ossl_param_bld);

        const _key = _heap_malloc(key.byteLength);
        _key.set(key, 0);

        libcrypto._EVP_MAC_init(this._evp_mac_ctx, _key.byteOffset, _key.byteLength, _ossl_param);
        _heap_free(_key);

        libcrypto._EVP_MAC_free(_evp_mac);
        _heap_free(_name);

        libcrypto._OSSL_PARAM_free(_ossl_param);
        _heap_free(_ossl_mac_param_key);
        _heap_free(_algorithm);
    }

    update(data) {
        const _buffer = _heap_malloc(data.byteLength);
        _buffer.set(data, 0);

        if (!libcrypto._EVP_MAC_update(this._evp_mac_ctx, _buffer.byteOffset, _buffer.byteLength)) {
            _heap_free(_buffer);
            throw new Error("Call to 'EVP_MAC_update' failed");
        }

        _heap_free(_buffer);
        return this;
    }

    final() {
        const _length = _heap_malloc(4);

        if (!libcrypto._EVP_MAC_final(this._evp_mac_ctx, 0, _length.byteOffset, 0)) {
            _heap_free(_length);
            throw new Error('Error determining MAC output length');
        }

        const _uint32_t = Uint8ArrayToUint32Array(_length);

        if (_uint32_t.length !== 1) {
            _heap_free(_length);
            throw new Error('Invalid MAC output length');
        }

        const _buffer = _heap_malloc(_uint32_t[0]);
        _heap_free(_length);

        if (!libcrypto._EVP_MAC_final(this._evp_mac_ctx, _buffer.byteOffset, 0, _buffer.byteLength)) {
            _heap_free(_buffer);
            throw new Error("Call to 'EVP_MAC_final' failed");
        }

        libcrypto._EVP_MAC_CTX_free(this._evp_mac_ctx);

        const _final = new Uint8Array(_buffer);
        _heap_free(_buffer);

        return _final;
    }

}

const createMac = (name, algorithm, key) => {
    if (typeof name !== 'string') {
        throw new TypeError("Type of parameter 'name' should be string");
    }

    if (typeof algorithm !== 'string') {
        throw new TypeError("Type of parameter 'algorithm' should be string");
    }

    if (typeof key !== 'object' || !(key instanceof Uint8Array)) {
        throw new TypeError("Type of parameter 'key' should be Uint8Array");
    }

    if (!(name in _MAC_NAME_MAP)) {
        throw new Error(`The specified mac "${name}" is not supported`);
    }

    const _mac_name = _MAC_NAME_MAP[name];
    if (!(algorithm in _MAC_ALGORITHM_MAP[_mac_name])) {
        throw new Error(`The specified algorithm "${algorithm}" for mac "${name}" is not supported`);
    }

    const _algorithm_name = _MAC_ALGORITHM_MAP[_mac_name][algorithm];
    const _keyLength = _MAC_CIPHER_KEY_LENGTH[_algorithm_name];

    if (_keyLength && key.byteLength !== _keyLength) {
        throw new Error(`Algorithm "${algorithm}" requires a ${_keyLength * 8}-bit (${_keyLength}-byte) key length`);
    }

    return new Mac(_mac_name, _algorithm_name, key);
};

module.exports = { createMac };
