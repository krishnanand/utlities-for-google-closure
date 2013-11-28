/*
 * Copyright (C) 2013 Google Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Encapsulates utilities for making asynchronous utility
 *     functions.
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.async.XhrIo');

goog.require('goog.Uri');
goog.require('goog.net.Cookies');
goog.require('goog.net.XhrIo');
goog.require('goog.structs');
goog.require('goog.structs.Map');
goog.require('goog.uri.utils');


/**
 * Static send that creates a short lived instance of XhrIo to send the
 * request.
 * @see goog.net.XhrIo.cleanup
 * @param {string|goog.Uri} url Uri to make request to.
 * @param {Function=} opt_callback Callback function for when request is
 *     complete.
 * @param {string=} opt_method Send method, default: GET.
 * @param {ArrayBuffer|Blob|Document|FormData|GearsBlob|string=} opt_content
 *     Body data.
 * @param {Object|goog.structs.Map=} opt_headers Map of headers to add to the
 *     request.
 * @param {number=} opt_timeoutInterval Number of milliseconds after which an
 *     incomplete request will be aborted; 0 means no timeout is set.
 * @param {boolean=} opt_withCredentials Whether to send credentials with the
 *     request. Default to false. See {@link goog.net.XhrIo#setWithCredentials}.
 */
treasury.async.XhrIo.send = function(
    url, opt_callback, opt_method, opt_content, opt_headers,
    opt_timeoutInterval) {
  var headers = new goog.structs.Map();
  // Add headers specific to this request
  if (opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value);
    });
  }
  // Show that the request is an asynchronous request.
  headers.set('X-Requested-With', 'XMLHttpRequest');
  treasury.async.XhrIo.csrfProtect(headers, url, opt_method);
  goog.net.XhrIo.send(url, opt_callback, opt_method, opt_content, headers,
      opt_timeoutInterval);
};


/**
 * Adds CSRF token to unsafe requests. The approach is taken from
 * https://docs.djangoproject.com/en/1.3/ref/contrib/csrf/#ajax
 *
 * @param {!goog.structs.Map|!Object} headers Map of HTTP headers.
 * @param {string|goog.Uri} url Uri to connect to.
 * @param {string=} opt_method type of request.
 */
treasury.async.XhrIo.csrfProtect = function(headers, url, opt_method) {
  var method = opt_method || 'GET';
  var isSafeMethod = /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
  var uriOne = goog.Uri.resolve(document.location.href, url);
  var uriTwo = goog.Uri.parse(document.location.href);
  var isSameOrigin = goog.uri.utils.haveSameDomain(
      uriOne.toString(), uriTwo.toString());
  if (!isSafeMethod && isSameOrigin) {
    var csrfToken = new goog.net.Cookies(document).get('csrftoken');
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }
};

goog.exportSymbol('treasury.async.XhrIo.send', treasury.async.XhrIo.send);
goog.exportSymbol(
    'treasury.async.XhrIo.csrfProtect', treasury.async.XhrIo.csrfProtect);