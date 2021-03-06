/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-env mocha, browser */

import RequestWrapper from '../../src/lib/request-wrapper.js';
import StaleWhileRevalidate from '../../src/lib/stale-while-revalidate.js';

importScripts('/packages/workbox-runtime-caching/test/utils/setup.js');

describe(`Test of the StaleWhileRevalidate handler`, function() {
  const CACHE_NAME = location.href;
  const COUNTER_URL = new URL('/__echo/counter', location).href;
  const CROSS_ORIGIN_COUNTER_URL = generateCrossOriginUrl(COUNTER_URL);

  let globalStubs = [];

  beforeEach(async function() {
    await caches.delete(CACHE_NAME);
  });

  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should add the initial response to the cache`, async function() {
    const requestWrapper = new RequestWrapper(
      {cacheName: CACHE_NAME});
    const staleWhileRevalidate = new StaleWhileRevalidate(
      {requestWrapper, waitOnCache: true});

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await staleWhileRevalidate.handle({event});

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(cachedResponse, handleResponse);
  });

  it(`should return the cached response and not update the cache when the network request fails`, async function() {
    globalStubs.push(sinon.stub(self, 'fetch').throws('NetworkError'));

    const requestWrapper = new RequestWrapper(
      {cacheName: CACHE_NAME});
    const staleWhileRevalidate = new StaleWhileRevalidate(
      {requestWrapper, waitOnCache: true});

    const firstCachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(COUNTER_URL, firstCachedResponse.clone());

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await staleWhileRevalidate.handle({event});

    await expectSameResponseBodies(firstCachedResponse, handleResponse);

    const secondCachedResponse = await cache.match(COUNTER_URL);

    await expectSameResponseBodies(firstCachedResponse, secondCachedResponse);
  });

  it(`should return the cached response and update the cache when the network request succeeds`, async function() {
    const requestWrapper = new RequestWrapper(
      {cacheName: CACHE_NAME});
    const staleWhileRevalidate = new StaleWhileRevalidate(
      {requestWrapper, waitOnCache: true});

    const firstCachedResponse = new Response('response body');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(COUNTER_URL, firstCachedResponse.clone());

    const wrapperCache = await requestWrapper.getCache();
    const cachePutPromise = new Promise((resolve) => {
      const cachePutStub = sinon.stub(wrapperCache, 'put').callsFake((request, response) => {
        resolve(response);
      });
      globalStubs.push(cachePutStub);
    });

    const event = new FetchEvent('fetch', {request: new Request(COUNTER_URL)});
    const handleResponse = await staleWhileRevalidate.handle({event});

    await expectSameResponseBodies(firstCachedResponse, handleResponse);

    const secondCachedResponse = await cachePutPromise;

    await expectDifferentResponseBodies(firstCachedResponse, secondCachedResponse);
  });

  it(`should update the cache with an the opaque cross-origin network response`, async function() {
    const requestWrapper = new RequestWrapper(
      {cacheName: CACHE_NAME});
    const staleWhileRevalidate = new StaleWhileRevalidate(
      {requestWrapper, waitOnCache: true});

    const wrapperCache = await requestWrapper.getCache();
    const cachePutPromise = new Promise((resolve) => {
      const cachePutStub = sinon.stub(wrapperCache, 'put').callsFake((request, response) => {
        resolve(response);
      });
      globalStubs.push(cachePutStub);
    });

    const event = new FetchEvent('fetch',
      {request: new Request(CROSS_ORIGIN_COUNTER_URL, {mode: 'no-cors'})});
    const handleResponse = await staleWhileRevalidate.handle({event});

    expect(handleResponse.type).to.eql('opaque');

    const cachedResponse = await cachePutPromise;

    expect(cachedResponse.type).to.eql('opaque');
  });
});
