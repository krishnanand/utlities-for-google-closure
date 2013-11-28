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
 * @fileoverview A class defining the data parsers.
 * @author kartik
 */
//TODO(kartik): Move this to enums.

goog.provide('treasury.ui.DataParsers');
goog.require('goog.array');



/**
 * An instance of this class represents one data parsers.
 * @constructor
 *
 * @param {string} id represents the parser identity.
 * @param {function(*): boolean} is Function representing the condition that
 *     must return true if the parser is to be applied.
 * @param {function(*): *} format function to format the data.
 * @param {function(*, *): number} compare function to be used to compare data.
 * @param {string} dataType represents the data type.
 */
treasury.ui.DataParsers = function(id, is, format, compare, dataType) {

  /**
   * Represents the parser identity.
   * @type {string}
   */
  this.id = id;

  /**
   * Represents the function that is to be evaluated to determine the data type.
   * @type {function(*): boolean}
   */
  this.is = is;

  /**
   * Represents the function that presents the data to be evaluated for sorting.
   * @type {function(*): *}
   */
  this.format = format;

  /**
   * Represents the function that should be applied for comparison.
   * @type {function(*, *): number}
   */
  this.compare = compare;

  /**
   * Represents the data type for which the parser should be applied.
   * @type {string}
   */
  this.dataType = dataType;
};


/**
 * Returns an array of data parsers to determine the type of data to be parsed.
 * @typedef {Array.<treasury.ui.DataParsers>} array of data parser objects.
 */
treasury.ui.DataParsers.dataParsers = null;


/**
 * Returns an array of data parsers.
 * @return {!Array.<treasury.ui.DataParsers>} Array of data parsers objects.
 */
treasury.ui.DataParsers.getDataParsers = function() {
  if (treasury.ui.DataParsers.dataParsers) {
    return treasury.ui.DataParsers.dataParsers;
  }
  treasury.ui.DataParsers.dataParsers = new Array();
  treasury.ui.DataParsers.dataParsers.push(
      new treasury.ui.DataParsers(
          'digit', function(s) {
            return /^[-+(]?\d+\)?$/.test(
                goog.string.trim(s.replace(/[,.']/g, '')));
          }, function(s) {
            s = s.replace(/[,']/g, '');
            if (/^\({1}\d+\){1}/.test(s)) {
              var results = s.match(/\((\d+)\){1}/);
              s = '-' + results[1];
            }
            return goog.isDefAndNotNull(s) ? parseFloat(s) : 0;
          }, treasury.ui.DataParsers.numericSort, 'numeric'),
      new treasury.ui.DataParsers(
          'currency', function(s) {
            return /^\(?[£¥$€?,.+-]\d+\)?/.test(s);
          }, function(s) {
            s = s.replace(new RegExp(/[£$¥€,]/g), '');
            // Check if the number is negative.
            if (/^\({1}\d+\){1}/.test(s)) {
              var results = s.match(/\((\d+)\){1}/);
              s = '-' + results[1];
            }
            return parseFloat(s);
          }, treasury.ui.DataParsers.numericSort, 'numeric'),
      new treasury.ui.DataParsers(
          'usLongDate', function(s) {
            var regex =
                '^([A-Za-z]{3,10}[\.,]? [0-9]{1,2}, [0-9]{4}), ' +
                '([0-9]{1,2}):([0-5][0-9])(:[0-5][0-9])? ' +
                '([aApP]\.?\s?[mM]\.?)$';
            return s.match(new RegExp(regex));
          }, function(s) {
            var regex =
                '^([A-Za-z]{3,10}[\.,]? [0-9]{1,2}, [0-9]{4}), ' +
                '([0-9]{1,2}):([0-5][0-9])(:[0-5][0-9])? ' +
                '([aApP]\.?\s?[mM]\.?)$';
            var results = s.match(new RegExp(regex));
            // The values include am or AM or a.m. or pm or PM or p.m.
            var timeOfDay = results[5];
            var hourOfDay = results[2];
            if (timeOfDay == 'pm' || timeOfDay == 'PM' || timeOfDay == 'p.m.') {
              if (hourOfDay != '12') {
                hourOfDay = parseInt(hourOfDay, 10) + 12;
              }
            } else {
              hourOfDay = parseInt(hourOfDay, 10);
            }
            // Create date while ignoring milli seconds.
            var date = results[1] + ' ' + hourOfDay + ':' + results[3];
            return Date.parse(date);
          }, treasury.ui.DataParsers.numericSort, 'numeric'),
      new treasury.ui.DataParsers(
          'shortDate', function(s) {
            return /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(s);
          }, function(s) {
            s = s.replace(/\-/g, '/');
            s = s.replace(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, '$1/$2/$3');
            return parseFloat(new Date(s).getTime());
          }, treasury.ui.DataParsers.numericSort, 'numeric'),
      new treasury.ui.DataParsers(
          'time', function(s) {
            var regex =
                '^(([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9].*(am|pm)))$';
            return s.match(new RegExp(regex));
          }, function(s) {
            return parseFloat(new Date('2000/01/01 ' + s).getTime());
          }, treasury.ui.DataParsers.numericSort, 'numeric'),
      new treasury.ui.DataParsers(
          'blackFontCurrency', function(s) {
            // Get the actual number.
            var results =
                s.match(new RegExp(/<font color=\"black\">(.*)<\/font>/));
            if (!results) {
              return false;
            }
            results = results[1].replace(new RegExp(/[\(\)£$¥€,]/g), '');
            try {
              if (parseFloat(results)) {
                return true;
              }
            } catch (error) {
              return true;
            }
          }, function(s) {
            var results =
                s.match(new RegExp(/<font color=\"black\">(.*)<\/font>/))[1];
            results = results.replace(new RegExp(/[\(\)£$¥€,]/g), '');
            return parseFloat(results);
          }, treasury.ui.DataParsers.numericSort, 'numeric'),
      new treasury.ui.DataParsers(
          'text', function(s) {
            return true;
          }, function(s) {
            return goog.string.trim(/** @type {string} */ (s));
          }, treasury.ui.DataParsers.alphaSort, 'text'));
  return treasury.ui.DataParsers.dataParsers;
};


/**
 * Alphabet sort function
 * @param {*} a First sort value.
 * @param {*} b Second sort value.
 * @return {number} Negative if a < b, 0 if a = b, and positive if a > b.
 */
treasury.ui.DataParsers.alphaSort = goog.array.defaultCompare;


/**
 * A numeric sort function.
 * @param {*} first First sort value.
 * @param {*} second Second sort value.
 * @return {number} Negative if first < second, 0 if first == second, and
 *     Positive if first > second.
 */
treasury.ui.DataParsers.numericSort = function(first, second) {
  return parseFloat(first) - parseFloat(second);
};