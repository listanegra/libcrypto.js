const libcrypto = require('../../libcrypto');

/**
 * Allocates heap memory accessible from WASM
 * @param {number} byteLength Number of bytes to allocate
 * @returns {Uint8Array} The allocated buffer
 */
const _heap_malloc = (byteLength) =>
    new Uint8Array(libcrypto.HEAP8.buffer, libcrypto._malloc(byteLength), byteLength);

/**
 * Creates a UTF-8 string buffer
 * @param {string} string Text to write into buffer
 * @returns {Uint8Array} The new allocated buffer with the string's content
 */
const _heap_utf8_string = (string) => {
    const _buffer = _heap_malloc(string.length + 1);

    for (let i = 0; i < string.length; i++) {
        _buffer[i] = string.charCodeAt(i);
    }

    _buffer[string.length] = 0x0;
    return _buffer;
};

/**
 * Frees previously allocated buffer from {@link _heap_malloc}
 * @param {Uint8Array} buffer 
 */
const _heap_free = (buffer) => {
    libcrypto._free(buffer.byteOffset);
};

module.exports = {
    _heap_free,
    _heap_malloc,
    _heap_utf8_string,
};
