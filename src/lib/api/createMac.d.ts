export declare interface Mac {
    update(data: Uint8Array): Mac;
    final(): Uint8Array;
}

export type HmacAlgorithm =
    "md5" | "sha-1" | "sha-224" | "sha-256" | "sha-384" | "sha-512" | "sha3-224" | "sha3-256" | "sha3-384" | "sha3-512";

export type CmacAlgorithm =
    "aes-128-cbc" | "aes-192-cbc" | "aes-256-cbc";

type MacAlgorithm = {
    "hmac": HmacAlgorithm;
    "cmac": CmacAlgorithm;
};

export declare function createMac<T extends keyof MacAlgorithm>(name: T, algorithm: MacAlgorithm[T], key: Uint8Array): Mac;
