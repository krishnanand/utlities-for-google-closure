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
 * @fileoverview Component implementation that can be used to filter table rows
 * if they are hidden either by setting the display to {@code none} and by
 * if the class selector is set to {@code hide}.
 *
 * The implementation sets the even and odd table rows with class selector
 * {@code even} and {@code odd}
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.ui.StripedTable');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');
goog.require('treasury.ui.Collapse');



/**
 * Sets up stripes for odd and even rows for a table. This component is used to
 * decorate an already rendered table.
 *
 * The table rows can optionally filter by style display attribute of a table
 * row and {@code hideSelector} to set the filtered rows the <em>odd</em> and
 * <em>even</em> selectors.
 *
 * @param {boolean=} opt_filterHiddenRows Optional flag used to determine if the
 *     hidden table rows should be filtered out.
 * @param {string=} opt_hideSelector Class selector applied to table row to hide
 *     it.
 * @param {string=} opt_oddSelector Class selector applied to odd numbered rows.
 * @param {string=} opt_evenSelector Class selector applied to even numbered
 *     rows.
 * @param {treasury.ui.MultiRowTableSorter=} opt_tableSorter Optional
 *     MultiRowTableSorter instance.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM Helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
treasury.ui.StripedTable = function(
    opt_filterHiddenRows, opt_hideSelector, opt_oddSelector, opt_evenSelector,
    opt_tableSorter, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * Flag value used to determine if the hidden rows are to be filtered out.
   * @type {boolean}
   * @private
   */
  this.filterHiddenRows_ = opt_filterHiddenRows || false;

  /**
   * Represents the class selector to be applied to table row to hide it.
   * @type {string}
   * @private
   */
  this.hideSelector_ = opt_hideSelector || 'hide';

  /**
   * Represents the class selector to be applied to odd numbered table rows.
   * @type {string}
   * @private
   */
  this.oddSelector_ = opt_oddSelector || 'odd';

  /**
   * Represents the class selector to be applied to even numbered table rows.
   * @type {string}
   * @private
   */
  this.evenSelector_ = opt_evenSelector || 'even';

  /**
   * Tablesorter implementation that is to be executed before the stripes can be
   * applied.
   * @type {treasury.ui.MultiRowTableSorter}
   * @private
   */
  this.tableSorter_ = opt_tableSorter || null;

  this.addTableSorterAsChild_();

  /**
   * Collapse element bound to a table.
   * @type {treasury.ui.Collapse}
   * @private
   */
  this.collapse_ = null;

};
goog.inherits(treasury.ui.StripedTable, goog.ui.Component);


/**
 * Adds the table sorter implementation as a child of the striped component.
 *
 * @private
 */
treasury.ui.StripedTable.prototype.addTableSorterAsChild_ = function() {
  if (this.tableSorter_) {
    this.addChild(this.tableSorter_);
  }
};


/**
 * Initializes the collapse element with appropriate selectors.
 *
 * @param {!Array.<Element>|NodeList} selectors Selectors bound to the collapse
 *     instance.
 */
treasury.ui.StripedTable.prototype.initCollapse = function(selectors) {
  this.collapse_ = new treasury.ui.Collapse(selectors);
  this.addChild(this.collapse_);
};


/**
 * Registers the listeners to be bound to table sorter and collapse event
 * targets.
 *
 * @override
 */
treasury.ui.StripedTable.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  // Setting up a 'hidden', 'collapsed' and 'shown' event for Collapse event.
  if (this.collapse_) {
    this.getHandler().listenWithScope(
        this.collapse_, 'hidden', this.resetZebraHandler_, false,
        this);
    this.getHandler().listenWithScope(
        this.collapse_, 'shown', this.resetZebraHandler_, false,
        this);
    this.getHandler().listenWithScope(
        this.collapse_, 'collapsed', this.resetZebraHandler_, false,
        this);
  }

  if (this.tableSorter_) {
    this.getHandler().listenWithScope(
        this.tableSorter_, 'sort', this.resetZebraHandler_, false, this);
  }
};


/**
 * Default browser event handler to reset zebra stripes.
 *
 * @param {!goog.events.BrowserEvent} event Bubbled browser event.
 * @private
 */
treasury.ui.StripedTable.prototype.resetZebraHandler_ = function(event) {
  event.preventDefault();
  this.resetZebra_(this.getElement());
};


/**
 * Resets the zebra stripes for odd and even numbered rows.
 * The method can be used to decorate the table and also after the table has
 * been sorted or expanded or collapsed.
 *
 * @param {Element} tableElement HTML table element.
 * @private
 */
treasury.ui.StripedTable.prototype.resetZebra_ = function(tableElement) {
  var filteredRows = this.filterTableRows_(tableElement);
  goog.array.forEach(filteredRows, function(filteredRow, idx) {
    if (idx % 2 == 0) {
      goog.dom.classes.remove(
          filteredRow, this.oddSelector_, this.evenSelector_);
      goog.dom.classes.add(filteredRow, this.evenSelector_);
    } else {
      goog.dom.classes.remove(
          filteredRow, this.oddSelector_, this.evenSelector_);
      goog.dom.classes.add(filteredRow, this.oddSelector_);
    }
  }, this);
};


/**
 * Returns {@code true} if the element to be decorated is a table.
 *
 * @param {Element} element Element to be decorated.
 * @return {boolean} True if the element can be decorated; false otherwise.
 * @override
 */
treasury.ui.StripedTable.prototype.canDecorate = function(element) {
  return element.tagName == goog.dom.TagName.TABLE;
};


/**
 * Sets the odd and even selectors to <em>odd</em> and <em>even</em> rows.
 *
 * @param {Element} element Element to be decorated.
 * @override
 */
treasury.ui.StripedTable.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  if (this.tableSorter_) {
    this.tableSorter_.decorate(element);
  }
  if (this.collapse_) {
    this.collapse_.decorate(element);
  }
  this.resetZebra_(this.getElement());
};


/**
 * Filters and returns an array of filtered rows.
 *
 * If the {@code filterHiddenRow_} flag is set to true, then all the rows having
 * the style display set to <em>none</em> or the class selector equal to
 * {@code hideSelector_} are removed before the selectors for odd and even
 * numbered rows can be applied.
 *
 * @param {Element} tableElement Table Element.
 * @return {!Array.<Element>} Array of table rows filtered.
 * @private
 */
treasury.ui.StripedTable.prototype.filterTableRows_ = function(tableElement) {
  var tableRows = tableElement.tBodies[0].rows;
  if (!this.filterHiddenRows_) {
    return tableRows;
  }
  return goog.array.filter(tableRows, function(tableRow) {
    return tableRow.style.display != 'none' &&
           !goog.dom.classes.has(tableRow, this.hideSelector_);
  }, this);
};