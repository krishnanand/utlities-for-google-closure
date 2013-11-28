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
 * @fileoverview Encapsulates common test utility functions. The functions may
 * be responsible for assertion behaviour or generated outputs resulting of an
 * executed test.
 *
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.testing.utils');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.testing.asserts');

goog.setTestOnly('treasury.testing.utils');


/**
 * Collates the output of the table columns in an array to compare it with the
 * expected output.
 *
 * The implementation gathers the data for those columns whose display style is
 * not set to {@code none}. The implementation does not verify the tag names of
 * the HTML elements. That responsibility is delegated to the invoking function.
 *
 * @param {!Element} tableElement HTML table element.
 * @param {!Array.<string>} expected array contents.
 * @param {string=} opt_hideSelector Optional hide selector.
 */
treasury.testing.utils.assertTableElementOrder =
    function(tableElement, expected, opt_hideSelector) {
  var hideSelector = opt_hideSelector || '';
  var rowsElement =
      goog.dom.getElementsByTagNameAndClass('tbody tr', null, tableElement);
  var actual = [];
  goog.array.forEach(rowsElement, function(tr) {
    if (tr.style.display != 'none' && !goog.dom.classes.has(tr, hideSelector)) {
      goog.array.forEach(
          goog.dom.getElementsByTagNameAndClass('td', null, tr),
          function(td) {
            var txt = goog.dom.getTextContent(td);
            if (txt) {
              actual.push(txt);
            }
          });
    }
  });
  assertArrayEquals(expected, actual);
};

goog.exportSymbol(
    'treasury.testing.utils.assertTableElementOrder',
    treasury.testing.utils.assertTableElementOrder);