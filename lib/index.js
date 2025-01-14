/**
 * An implementation of the RDF Dataset Normalization specification.
 * This library works in the browser and node.js.
 *
 * BSD 3-Clause License
 * Copyright (c) 2016-2022 Digital Bazaar, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of the Digital Bazaar, Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

const URDNA2015 = require('./URDNA2015');
const URGNA2012 = require('./URGNA2012');
const URDNA2015Sync = require('./URDNA2015Sync');
const URGNA2012Sync = require('./URGNA2012Sync');

// optional native support
let rdfCanonizeNative;
try {
  rdfCanonizeNative = require('rdf-canonize-native');
} catch(e) {}

// expose helpers
exports.NQuads = require('./NQuads');
exports.IdentifierIssuer = require('./IdentifierIssuer');

/**
 * Get or set native API.
 *
 * @param api the native API.
 *
 * @return the currently set native API.
 */
exports._rdfCanonizeNative = function(api) {
  if(api) {
    rdfCanonizeNative = api;
  }
  return rdfCanonizeNative;
};

/**
 * Asynchronously canonizes an RDF dataset.
 *
 * @param {Array} dataset - The dataset to canonize.
 * @param {object} options - The options to use:
 *   {string} algorithm - The canonicalization algorithm to use, `URDNA2015` or
 *     `URGNA2012`.
 *   {Function} [createMessageDigest] - A factory function for creating a
 *     `MessageDigest` interface that overrides the built-in message digest
 *     implementation used by the canonize algorithm; note that using a hash
 *     algorithm (or HMAC algorithm) that differs from the one specified by
 *     the canonize algorithm will result in different output.
 *   {boolean} [useNative=false] - Use native implementation.
 *   {number} [maxDeepIterations=Infinity] - The maximum number of times to run
 *     deep comparison algorithms (such as the N-Degree Hash Quads algorithm
 *     used in URDNA2015) before bailing out and throwing an error; this is a
 *     useful setting for preventing wasted CPU cycles or DoS when canonizing
 *     meaningless or potentially malicious datasets, a recommended value is
 *     `1`.
 *
 * @return a Promise that resolves to the canonicalized RDF Dataset.
 */
exports.canonize = async function(dataset, options) {
  // back-compat with legacy dataset
  if(!Array.isArray(dataset)) {
    dataset = exports.NQuads.legacyDatasetToQuads(dataset);
  }

  if(options.useNative) {
    if(!rdfCanonizeNative) {
      throw new Error('rdf-canonize-native not available');
    }
    if(options.createMessageDigest) {
      throw new Error(
        '"createMessageDigest" cannot be used with "useNative".');
    }
    return new Promise((resolve, reject) =>
      rdfCanonizeNative.canonize(dataset, options, (err, canonical) =>
        err ? reject(err) : resolve(canonical)));
  }

  if(options.algorithm === 'URDNA2015') {
    return new URDNA2015(options).main(dataset);
  }
  if(options.algorithm === 'URGNA2012') {
    if(options.createMessageDigest) {
      throw new Error(
        '"createMessageDigest" cannot be used with "URGNA2012".');
    }
    return new URGNA2012(options).main(dataset);
  }
  if(!('algorithm' in options)) {
    throw new Error('No RDF Dataset Canonicalization algorithm specified.');
  }
  throw new Error(
    'Invalid RDF Dataset Canonicalization algorithm: ' + options.algorithm);
};

/**
 * This method is no longer available in the public API, it is for testing
 * only. It synchronously canonizes an RDF dataset and does not work in the
 * browser.
 *
 * @param {Array} dataset - The dataset to canonize.
 * @param {object} options - The options to use:
 *   {string} algorithm - The canonicalization algorithm to use, `URDNA2015` or
 *     `URGNA2012`.
 *   {Function} [createMessageDigest] - A factory function for creating a
 *     `MessageDigest` interface that overrides the built-in message digest
 *     implementation used by the canonize algorithm; note that using a hash
 *     algorithm (or HMAC algorithm) that differs from the one specified by
 *     the canonize algorithm will result in different output.
 *   {boolean} [useNative=false] - Use native implementation.
 *   {number} [maxDeepIterations=Infinity] - The maximum number of times to run
 *     deep comparison algorithms (such as the N-Degree Hash Quads algorithm
 *     used in URDNA2015) before bailing out and throwing an error; this is a
 *     useful setting for preventing wasted CPU cycles or DoS when canonizing
 *     meaningless or potentially malicious datasets, a recommended value is
 *     `1`.
 *
 * @return the RDF dataset in canonical form.
 */
exports._canonizeSync = function(dataset, options) {
  // back-compat with legacy dataset
  if(!Array.isArray(dataset)) {
    dataset = exports.NQuads.legacyDatasetToQuads(dataset);
  }

  if(options.useNative) {
    if(!rdfCanonizeNative) {
      throw new Error('rdf-canonize-native not available');
    }
    if(options.createMessageDigest) {
      throw new Error(
        '"createMessageDigest" cannot be used with "useNative".');
    }
    return rdfCanonizeNative.canonizeSync(dataset, options);
  }
  if(options.algorithm === 'URDNA2015') {
    return new URDNA2015Sync(options).main(dataset);
  }
  if(options.algorithm === 'URGNA2012') {
    if(options.createMessageDigest) {
      throw new Error(
        '"createMessageDigest" cannot be used with "URGNA2012".');
    }
    return new URGNA2012Sync(options).main(dataset);
  }
  if(!('algorithm' in options)) {
    throw new Error('No RDF Dataset Canonicalization algorithm specified.');
  }
  throw new Error(
    'Invalid RDF Dataset Canonicalization algorithm: ' + options.algorithm);
};
