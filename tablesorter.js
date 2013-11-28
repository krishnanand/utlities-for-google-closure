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
 * @fileoverview Implements the multiple row table sorter. The implementation
 * sorts mutliple rows in ascending or descending order based on a specific row
 * of comparison. The implementation is also flexible enough to sort single rows
 * at a time.
 *
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.ui.MultiRowTableSorter');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.structs.Map');
goog.require('goog.ui.Component');
goog.require('treasury.ui.DataParsers');



/**
 * A multiple row table sorter allows for table sorting of multiple rows by
 * column. This component is used to decorate the already existing TABLE element
 * with sorting features.
 *
 * The <TABLE> element should use a <THEAD> elements for the table column
 * headers. The implementation borrows heavily from goog.ui.TableSorter
 * implementation to set up multiple row column sorter.
 *
 * The implementation also differs from goog.ui.TableSorter implementation in
 * the sorting function detection. But this implementation is different from
 * the implementation in the following ways:
 *
 * <ul>
 *   <li>The user is not required to configure sorting function for every column
 *       at run time. This is handled by data parsers which are associated with
 *       a column at load time.</li>
 *   <li>There is no default parsing for any column. At the same time, all
 *        columns are considered to be sortable.</li>
 * </ul>
 *
 * The implementation assumes that the data in the column is homogenous i.e.
 * the data in a particular column should not contain numeric values and, say,
 * dates.
 *
 * The implementation also supports pagination coupled with sorting. For the
 * HTML set up for pagination, please refer to JsDocs for paginator.js.
 *
 * @param {number=} opt_rowIndexUsedForComparison Row whose values are to be
 *     considered for sorting.
 * @param {number=} opt_numRowsAsBlock Number of rows that should be considered
 *     as a single block.
 * @param {boolean=} opt_fixedWidth Flag to indicate that a fixed width is to be
 *     applied.
 * @param {string=} opt_sortRowSelector Optional class selector to designate the
 *     table header row for which table sorting is to be enabled on click event.
 *     In it's absence, the first table header row is enabled.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM Helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
treasury.ui.MultiRowTableSorter = function(
    opt_rowIndexUsedForComparison, opt_numRowsAsBlock, opt_fixedWidth,
    opt_sortRowSelector, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * Represents an assocation with the column and parser to be used.
   * @type {!goog.structs.Map}
   * @private
   */
  this.parserMap_ = new goog.structs.Map();

  /**
   * Represents an association with the column and an overridden parsers to be
   * used in lieu of the default parsers.
   * @type {!goog.structs.Map}
   * @private
   */
  this.overriddenParserMap_ = new goog.structs.Map();

  /**
   * The current sort column of the table, or -1 if none.
   * @type {number}
   * @private
   */
  this.sortColumn_ = -1;

  /**
   * Flag to specify if the last column was in reverse.
   * @type {boolean}
   * @private
   */
  this.reversed_ = false;

  /**
   * The index of a row in a block of rows whose values are to be used to sort
   * a block of rows.
   * @type {number}
   * @private
   */
  this.rowIndexUsedForComparison_ = opt_rowIndexUsedForComparison || 0;

  /**
   * The number of rows to be considered a single "unit" of rows to be sorted up
   * or down. The row number indexes start from 0.
   * @type {number}
   * @private
   */
  this.numRowsAsBlock_ = opt_numRowsAsBlock || 1;

  /**
   * Applies fixed width to the table columns if true;
   * @type {boolean}
   * @private
   */
  this.fixedWidth_ = opt_fixedWidth || true;

  /**
   * Class selector to designate the table header row for which table sorting is
   * to be enabled on click event. In it's absence, the first table header row
   * is enabled.
   * @type {string}
   * @private
   */
  this.sortRowSelector_ = opt_sortRowSelector || null;


  /**
   * The array of column indices to which reverse sorting is to be applied.
   * @type {!Array.<number>}
   * @private
   */
  this.reverseList_ = [];

  /**
   * The column to which the exceptions to 'indexed row' must be applied.
   * Each key in this map represents a column to which an exception must be
   * applied. The value represents the row index used to be used as indexed row.
   * For e.g. for key-value pair 0-1, implies that for the 0th column index
   * (first element), the 1st row index should be the considered row.
   * @type {!goog.structs.Map}
   * @private
   */
  this.columnExceptionMap_ = new goog.structs.Map();
};
goog.inherits(treasury.ui.MultiRowTableSorter, goog.ui.Component);


/**
 * Returns the array of initialized parsers for each column.
 *
 * @return {!goog.structs.Map} Parser mappings.
 */
treasury.ui.MultiRowTableSorter.prototype.getParserMap = function() {
  return this.parserMap_;
};


/**
 * Sets up the header classes for the table to be decorated.
 * The implementation adds CSS class name 'headerSortUp' if the table is to
 * be sorted in ascending order and 'headerSortDown' when the table is to be
 * sorted in descending order. All header elements have the 'header' CSS class
 * name by default.
 *
 * @param {Element} element Element to be decorated.
 * @override
 */
treasury.ui.MultiRowTableSorter.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  // Iterates through the header elements. If the reverse sort index is
  // initialized for the header, then set the header class to 'headerSortDown'
  // else 'headerSortUp'.
  var headerRow =
      goog.dom.getElementsByTagNameAndClass(
          'thead tr', this.sortRowSelector_, this.getElement())[0];
  var cells = headerRow.cells;
  for (var i = 0; i < cells.length; i++) {
    goog.dom.classes.add(cells[i], 'header');
    goog.dom.classes.remove(
        cells[i], 'headerSortUp', 'headerSortDown');
    if (goog.array.contains(this.reverseList_, i)) {
      goog.dom.classes.add(cells[i], 'headerSortUp');
    }
  }
  this.applyFixedWidth_();
  this.detectParsers_();
};


/**
 * Applies fixed width to columns of the table to be sorted. This is done by
 * applying a colgroup element before the header.
 *
 * <p><em>IMPORTANT:</em>This function must be invoked during the decoration of
 * the table, but after the element has been initialized.
 *
 * @private
 */
treasury.ui.MultiRowTableSorter.prototype.applyFixedWidth_ = function() {
  var table = this.getElement();
  if (!this.fixedWidth_) {
    return;
  }
  // Get all the widths of the columns of first row of the table body.
  var firstColumns =
      /** @type {!goog.array.ArrayLike} */ (
          table.tBodies[0].querySelector('tr').querySelectorAll('td'));
  var headerRow =
      goog.dom.getElementsByTagNameAndClass(
          'thead tr', this.sortRowSelector_, this.getElement())[0];
  goog.array.forEach(firstColumns, function(firstColumn, idx) {
    headerRow.cells[idx].style.width = firstColumn.offsetWidth + 'px';
  }, this);
};