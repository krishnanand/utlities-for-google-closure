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
 * @fileoverview Implements and supports asynchronous file upload. Although
 * there is a inbuilt google technology named <a href="http://go/scotty">Scotty
 * <a/>, that requires creating a user agent handler in Python in addition to
 * protocol buffers. Instead this implementation supports the following
 * features as given below.
 * <ul>
 *   <li>multiple file select and upload.</li>
 *   <li>drag-and-drop file select and upload.</li>
 *   <li>file list deselection.</li>
 * </ul>
 *
 * <em>IMPORTANT:</em>It is important to note that the APIs used in this
 * implementation are only supported by recent versions of Firefox and Google
 * chrome browsers. See <a href="http://caniuse.com/#feat=filereader">
 * FileReader API</a> and <a href="http://caniuse.com/#feat=fileapi">
 * File API</a>. Microsoft is currently experimenting with this implementation.
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.ui.FileUploader');

goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.FileDropHandler');
goog.require('goog.net.EventType');
goog.require('goog.structs.Map');
goog.require('treasury.async.XhrIo');



/**
 * Root class to manage asynchronous file uploads.
 *
 * @param {string} url URL to connect to.
 * @param {!Element} inputField Represents the input field.
 * @param {!Element} fileList Represents the element in which the selected or
 *     dropped files are to be shown.
 * @param {goog.events.FileDropHandler=} opt_fileDropHandler Optional file drop
 *     handler.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
treasury.ui.FileUploader =
    function(url, inputField, fileList, opt_fileDropHandler) {
  goog.base(this);

  /**
   * URL to connect to.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * Represents the input file element.
   * @type {!Element}
   * @private
   */
  this.inputField_ = inputField;

  /**
   * Represents the HTML element in which the selected files are to be
   * displayed.
   * @type {!Element}
   * @private
   */
  this.fileList_ = fileList;

  /**
   * Events handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.handler_ = new goog.events.EventHandler(this);

  /**
   * File drop handler instance.
   * @type {goog.events.FileDropHandler}
   * @private
   */
  this.fileDropHandler_ = opt_fileDropHandler || null;

  /**
   * Encapsulates all the File objects.
   *
   * @type {!Array.<!File>}
   * @private
   */
  this.uploadedFiles_ = [];

  this.handleEvents();
};
goog.inherits(treasury.ui.FileUploader, goog.events.EventTarget);


/**
 * @type {number}
 * @const
 */
treasury.ui.FileUploader.HIDE_MSG_DELAY = 15000;


/**
 * Returns the list of uploaded file objects.
 *
 * @return {!Array.<!File>} Array of file objects to be uploaded.
 */
treasury.ui.FileUploader.prototype.getUploadedFiles = function() {
  return this.uploadedFiles_;
};


/**
 * Adds the file to an array comprising of files to be uploaded. This should
 * primarily be used for testing.
 *
 * @param {!File} file Adds the uploaded file object.
 */
treasury.ui.FileUploader.prototype.addUploadedFile = function(file) {
  this.uploadedFiles_.push(file);
};


/**
 * Register events to set up upload file list and to upload the files.
 *
 * @protected
 */
treasury.ui.FileUploader.prototype.handleEvents = function() {
  this.handler_.listen(
      this.inputField_, goog.events.EventType.CHANGE, this.handleSelectedFiles_,
      false, this);
  if (!!this.fileDropHandler_) {
    this.handler_.listen(
        this.fileDropHandler_, goog.events.EventType.DROP,
        this.addDraggedFileItems_, false, this);
  }
  var uploadElement = this.fileList_.querySelector('a#upload');
  if (!!uploadElement) {
    this.handler_.listen(
        uploadElement, goog.events.EventType.CLICK, this.handleUploadFiles_,
        false, this);
  }
  var clearElement = this.fileList_.querySelector('a#reset');
  if (!!clearElement) {
    this.handler_.listen(
        clearElement, goog.events.EventType.CLICK, this.clearFiles_, false,
        this);
  }
};


/**
 * Adds the selected file(s) to the file list when file(s) is/are selected.
 *
 * @param {!goog.events.BrowserEvent} event Fired browser event.
 * @private
 */
treasury.ui.FileUploader.prototype.handleSelectedFiles_ = function(event) {
  this.stopPropagation_(event);
  var files = event.target.files;
  this.addFilesToListItems_(files);
};


/**
 * Adds the selected file(s) to the file(s) list when file(s) is/are dragged and
 * dropped.
 *
 * @param {!goog.events.BrowserEvent} event Fired browser event triggered when
 *     the files are dragged on to the drop zone.
 * @private
 */
treasury.ui.FileUploader.prototype.addDraggedFileItems_ = function(event) {
  this.stopPropagation_(event);
  var files = event.getBrowserEvent().dataTransfer.files;
  this.addFilesToListItems_(files);
};


/**
 * Prevents any default behaviour from taking place.
 *
 * @param {!goog.events.BrowserEvent} event Fired browser event.
 * @private
 */
treasury.ui.FileUploader.prototype.stopPropagation_ = function(event) {
  event.stopPropagation();
  event.preventDefault();
};


/**
 * Reads the file for reading and displays the file in a user friendly manner.
 *
 * @param {!FileList} files File list objects representing the files that have
 *      either been selected or dragged and dropped.
 * @private
 */
treasury.ui.FileUploader.prototype.addFilesToListItems_ = function(files) {
  for (var i = 0; i < files.length; i++) {
    var fileReader = new FileReader();
    fileReader.file = files[i];
    this.handler_.listen(
        fileReader, 'loadend', this.addUploadedFilesToList, false, this);
    fileReader.readAsDataURL(files[i]);
  }
};


/**
 * Adds the loaded/read files to an array for an upload request to be made
 * later.
 *
 * <p>The implementation creates {@code LI} HTML element that encapsulates the
 * following elements:
 * <ul>
 *   <li>HTML paragraphs that encapsulates the uploaded file details such as the
 * name, size and type.</li>
 * </ul>
 *
 * @param {!goog.events.BrowserEvent} event Fired browser event triggered  when
 *     the files are dragged and dropped.
 */
treasury.ui.FileUploader.prototype.addUploadedFilesToList = function(event) {
  this.stopPropagation_(event);
  var file = event.getBrowserEvent().target.file;
  if (!!file) {
    var ul = this.fileList_.querySelector('ul');
    if (!!ul) {
      var li = document.createElement('li');
      // Append the file name.
      var p = document.createElement('p');
      var textNode = document.createTextNode(file.name);
      p.appendChild(textNode);
      // Append the mime type and the file size.
      var p1 = document.createElement('p');
      var textNode1 =
          document.createTextNode(
              'File type : (' + file.type + ') - ' +
              Math.round(file.size / 1024) + 'KB');
      p1.appendChild(textNode1);
      li.appendChild(p);
      li.appendChild(p1);
      ul.appendChild(li);
    }
    this.uploadedFiles_.push(file);
  }
};


/**
 * Uploads all the files to the server for processing.
 *
 * @param {!goog.events.BrowserEvent} event Fired browser event triggered when
 *     the files are uploaded.
 * @private
 */
treasury.ui.FileUploader.prototype.handleUploadFiles_ = function(event) {
  event.preventDefault();
  var formData = new FormData();
  for (var i = 0; i < this.uploadedFiles_.length; i++) {
    var uploadedFile = /** @type {!File} */ (this.uploadedFiles_[i]);
    formData.append(uploadedFile.name, uploadedFile);
  }
  var xhr = new XMLHttpRequest();
  this.showSuccess(xhr);
  this.showError(xhr);
  xhr.open('POST', this.url_, true);
  var headers = new goog.structs.Map();
  headers.set('X-Requested-With', 'XMLHttpRequest');
  treasury.async.XhrIo.csrfProtect(headers, this.url_, 'POST');
  var keys = headers.getKeys();
  for (var i = 0; i < keys.length; i++) {
    xhr.setRequestHeader(keys[i], /** @type {string} */ (headers.get(keys[i])));
  }
  xhr.send(formData);
};


/**
 * Clears the files in the list to be uploaded.
 *
 * @param {!goog.events.BrowserEvent} event Fired browser event triggered when
 *    the files are to be cleared before or after upload.
 * @private
 */
treasury.ui.FileUploader.prototype.clearFiles_ = function(event) {
  event.preventDefault();
  this.uploadedFiles_ = [];
  this.removeFileNodes_();
};


/**
 * Removes the list of uploaded files from the list.
 *
 * @private
 */
treasury.ui.FileUploader.prototype.removeFileNodes_ = function() {
  var ul = this.fileList_.querySelector('ul');
  while (ul.childNodes.length > 0) {
    ul.removeChild(ul.childNodes[ul.childNodes.length - 1]);
  }
};


/**
 * Displays the success message if the upload is successful.
 *
 * <p>The implementation expects JSON response. The structure of the expected
 * JSON response is given below.
 *
 * <ul>
 *  <li>The response will always be a JSON object of JSON objects. The primary
 * (or only key) for the JSON response will be {@code meta}. This error response
 * or the success response JSON objects will always be associated with this
 * key.</li>
 *  <li>The success or the error response JSON response objects WILL always be
 * referenced by {@code code} key. This is a numerical value representing the
 * status code (i.e. 200 for OK, 404 for Not Found etc.).</li>
 *  <li>If the status code equals {@code 200}, then the successful response can
 * be referenced by {@ data} key. The example is given below:
 * <pre>
 *   var successfulResponse = JSON.parse(xhr.responseText);
 *   var status =
 *       &#47;&#42;&#42; {@type number} *&#47; (
 *           successResponse['meta']['code']);
 *   if (status == 200) {
 *      // Success response.
 *      var response = successResponse['meta']['data'];
 *      // Do something with the successful response.
 *   } else {
 *      // Error response.
 *      // Access the error response to do
 *      var errorDetail = successResponse['meta']['errorDetail'];
 *      var errorMessage = successResposne['meta']['errorMessage'];
 *      // Do something with error response.
 *   }
 * </pre>
 * </li>
 * </ul>
 *
 * @param {!XMLHttpRequest} xhr XMLHttpRequest instance.
 */
//TODO(kartik): To create a call back function on success. Need to determine
//TODO(kartik): the logistics of. A static method that accepts an optional
//TODO(kartik): callback function on success and on failure seems the best
//TODO(kartik): alternative.
treasury.ui.FileUploader.prototype.showSuccess = function(xhr) {
  this.handler_.listen(
      xhr, 'load', function(event) {
        var xmlHttpRequest = /** @type {!XMLHttpRequest} */ (event.target);
        // Need support for error use cases.
        if (xmlHttpRequest.status == 200) {
          if (!!xmlHttpRequest.responseText) {
            var response = goog.json.parse(xmlHttpRequest.responseText);
            var status = /** @type {number} */ (response['meta']['code']);
            if (status == 200) {
              this.enableMessage_(
                  'Files uploaded successfully. ' +
                  'Please refresh the page if uploaded for the first time.');
              this.removeFileNodes_();
              this.handleResponseInternal(response['meta']['data']);
            } else {
              this.enableMessage_(response['meta']['errorMessage']);
            }
          }
        }
      }, false, this);
};


/**
 * Displays the error message if the upload is unsuccessful.
 *
 * @param {!XMLHttpRequest} xhr XMLHttpRequest instance.
 */
treasury.ui.FileUploader.prototype.showError = function(xhr) {
  this.handler_.listen(
      xhr, goog.net.EventType.ERROR, function(event) {
        // The error log should be in event.target.responseText but not required
        // for now. No i18n support required either.
        this.enableMessage_('The files could not be uploaded.');
      }, false, this);
};


/**
 * Shows the status messages to be displayed.
 *
 * @param {string=} opt_message Represents the message to be displayed; defaults
 *     to an empty string.
 * @private
 */
treasury.ui.FileUploader.prototype.enableMessage_ = function(opt_message) {
  var msg = opt_message || '';
  var messageBar = document.getElementsByClassName('message');
  if (!!messageBar && messageBar.length > 0) {
    goog.dom.classes.add(messageBar[0], 'shown');
    var spanElement = messageBar[0].querySelector('span');
    if (!!spanElement) {
      spanElement.innerHTML = msg;
    }
    treasury.ui.FileUploader.hideStatusMessage();
  }
};


/**
 * Disposes all the initialized listeners.
 *
 * @override
 */
treasury.ui.FileUploader.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.handler_.dispose();
  if (!!this.fileDropHandler_) {
    this.fileDropHandler_.dispose();
  }
};


/**
 * An abstract implementation that is responsible for handling the fetched json
 * response if any.
 *
 * <p>This function is deliberately left abstract so as to force developers to
 * implement the handling of the JSON response.
 *
 * @param {!Array.<Object.<*>>} response Returned JSON response.
 * @protected
 */
treasury.ui.FileUploader.prototype.handleResponseInternal =
    function(response) {};


/**
 * Hides the element representing the displayed message.
 *
 * The implementation assumes the following:
 * <ul>
 *   <li>HTML element encapsulating the message has a class selector
 * {@code message} containing a span element that will encapsulate the status
 * message to be populated.</li>
 *  <li>The implementation assumes that the butterbar kennedy set up is used to
 * style the HTML element.</li>
 * </ul>
 *
 * @param {number=} opt_timeInMs Time in milli seconds after which the message
 *     is to be hidden.
 */
treasury.ui.FileUploader.hideStatusMessage = function(opt_timeInMs) {
  // Remove the display element.
  var hide = function() {
    var elem = document.querySelector('.message');
    if (!!elem) {
      goog.dom.classes.remove(elem, 'shown');
    }
  };
  var interval = opt_timeInMs || treasury.ui.FileUploader.HIDE_MSG_DELAY;
  // Use settimeout.
  var delay = new goog.async.Delay(hide, interval);
  delay.start();
};
