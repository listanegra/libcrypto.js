default: dist/libcrypto.js

dist/libcrypto.js: openssl/libcrypto.a
	@mkdir -p dist/
	emcc $^ -O3 \
		-sWASM_ASYNC_COMPILATION=0 \
		-sNODEJS_CATCH_EXIT=0 \
		-sEXPORTED_FUNCTIONS="[ \
			'_malloc', \
			'_free', \
			'_OSSL_LIB_CTX_get0_global_default', \
			'_OSSL_PARAM_BLD_new', \
			'_OSSL_PARAM_BLD_free', \
			'_OSSL_PARAM_BLD_to_param', \
			'_OSSL_PARAM_free', \
			'_OSSL_PARAM_BLD_push_utf8_string', \
			'_EVP_MD_fetch', \
			'_EVP_MD_free', \
			'_EVP_MD_get_size', \
			'_EVP_MD_CTX_new', \
			'_EVP_MD_CTX_free', \
			'_EVP_DigestInit', \
			'_EVP_DigestUpdate', \
			'_EVP_DigestFinal', \
			'_EVP_MAC_fetch', \
			'_EVP_MAC_free', \
			'_EVP_MAC_CTX_new', \
			'_EVP_MAC_CTX_free', \
			'_EVP_MAC_init', \
			'_EVP_MAC_update', \
			'_EVP_MAC_final' \
		]" -o $@

openssl/libcrypto.a: openssl/Makefile
	emmake $(MAKE) -j$(shell nproc) -C openssl/ \
		CROSS_COMPILE="" build_generated libcrypto.a

openssl/Makefile:
	cd openssl/ && \
	emconfigure ./Configure --api=3.0 \
		no-deprecated \
		no-weak-ssl-ciphers \
		no-asm \
		no-threads \
		no-shared \
		no-engine \
		no-dso \
		no-dtls

clean:
	@emmake $(MAKE) -C openssl/ clean
	@rm -rf dist/

.PHONY: clean
