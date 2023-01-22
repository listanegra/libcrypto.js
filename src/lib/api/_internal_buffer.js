/**
 * Converts Uint8Array into Uint32Array LE (Little Endian)
 * @param {Uint8Array} array The input buffer
 * @returns {Uint32Array} The converted data
 */
const Uint8ArrayToUint32Array = (array) => {
    if (!(array instanceof Uint8Array)) {
        throw new TypeError("Type of parameter 'array' should be Uint8Array");
    }

    const length = Math.floor(array.byteLength / Uint32Array.BYTES_PER_ELEMENT);
    return new Uint32Array(array.buffer, array.byteOffset, length);
};

module.exports = { Uint8ArrayToUint32Array };
