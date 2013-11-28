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
 * @fileoverview Stub representation of XMLHttpRequest. This is particularly
 * useful for simulating AJAX requests without having to handle different
 * scenarios.
 * There is no intention to implement every function exposed by the real
 * instance of XMLHttpRequest, but only the ones required for the actual
 * functionality to be tested.
 * @see https://developer.mozilla.org/en/xmlhttprequest
 * @see https://developer.mozilla.org/en/DOM/XMLHttpRequest#send()
 * @see https://developer.mozilla.org/en/DOM/XMLHttpRequest#overrideMimeType()
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.testing.MockXmlHttpRequest');

goog.require('goog.events.EventTarget');

goog.setTestOnly('treasury.testing.MockXmlHttpRequest');



/**
 * Partial stub representation of XMLHttpRequest instance. The implementation
 * stubs the most common functions and attributes in order to simulate AJAX
 * requests.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
treasury.testing.MockXmlHttpRequest = function() {
  goog.base(this);

  /**
   * Mock representation of the HTTP headers.
   * @type {!Object.<string>}
   * @private
   */
  this.headers_ = {};

  /**
   * Counter incremented if {@code open} function is to be invoked.
   * @type {number}
   */
  this.openFunctionCounter = 0;

  /**
   * Counter incremented if {@code send} is invoked.
   * @type {number}
   */
  this.sendFunctionCounter = 0;

  /**
   * HTTP status code of the intended response.
   * @type {number}
   */
  this.status = 200;

  /**
   * The response to the request as text.
   * @type {string}
   */
  this.responseText = null;

  /**
   * The expected response type. This tells the server of the format you want
   * the response to be in.
   * @type {string}
   */
  this.responseType = '';

  /**
   * Represents the default mime of the expected response. This can be overriden
   * by {@link #overrideMimeType(string)}.
   * @type {string}
   * @private
   */
  this.mimeType_ = 'text/html';

  /**
   * Represents the request state.
   */
  this.readyState = 0;
};
goog.inherits(treasury.testing.MockXmlHttpRequest, goog.events.EventTarget);


/**
 * Returns the ready state.
 * @return {number} Represents the ready state.
 */
treasury.testing.MockXmlHttpRequest.prototype.getReadyState = function() {
  return this.readyState;
};


/**
 * Returns the status.
 * @return {number} Represents the status.
 */
treasury.testing.MockXmlHttpRequest.prototype.getStatus = function() {
  return this.status;
};


/**
 * Returns the response text.
 * @return {string} Represents the response text.
 */
treasury.testing.MockXmlHttpRequest.prototype.getResponseText = function() {
  return this.responseText;
};


/**
 * Sets the HTTP request header.
 *
 * @param {string} header Header key.
 * @param {string} value Header value.
 */
treasury.testing.MockXmlHttpRequest.prototype.setRequestHeader =
    function(header, value) {
  this.headers_[header] = value;
};


/**
 * Returns all HTTP requests.
 *
 * @return {!Object.<string>} Initialized request headers.
 */
treasury.testing.MockXmlHttpRequest.prototype.getAllRequestHeaders =
    function() {
  return this.headers_;
};


/**
 * Overrides the mime type of the response.
 *
 * @param {string} mimeType Represents the mime type of the expected response.
 */
treasury.testing.MockXmlHttpRequest.prototype.overrideMimeType =
    function(mimeType) {
  this.mimeType_ = mimeType;
};


/**
 * Sends the HTTP request.
 *
 * @param {(ArrayBuffer|Blob|Document|string|FormData)=} opt_data Data to be
 *     sent in HTTP request.
 */
treasury.testing.MockXmlHttpRequest.prototype.send = function(opt_data) {
  this.sendFunctionCounter++;
};


/**
 * Initializes a request.
 *
 * @param {string} method HTTP method.
 * @param {string} url URL to which to send a request.
 * @param {boolean=} opt_async Indicates if the operation is to be performed
 *     asynchronously.
 * @param {string=} opt_user Optional user name to use for authentication.
 * @param {string=} opt_password Optional password to use for authentication.
 * @see https://developer.mozilla.org/en/DOM/XMLHttpRequest#open().
 */
treasury.testing.MockXmlHttpRequest.prototype.open =
    function(method, url, opt_async, opt_user, opt_password) {
  this.openFunctionCounter++;
};