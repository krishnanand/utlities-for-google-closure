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
 * @fileoverview Enables the pagination for the table. The pagination component
 * can work in cohesion with the table sorter or as an independent component.
 *
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.ui.Paginator');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component');



/**
 * An instance of this class is used to enable pagination for a given table.
 * The implementation decorates the existing table with pagination
 * features. The implementation expects the pagination element to have the
 * following children elements.
 * <ul>
     <li>Element with class selector for <em>cssFirst</em> variable value will
         load the first page if clicked.</li>
     <li>Element with class selector for <em>cssPrev</em> variable value will
         load the previous page to be loaded.</li>
     <li>Input text field with class selector value for <em>cssPageDisplay</em>
         will hold the current page number as follows:
         <em>currentPageNumber/totalPages</em> i.e. {@code 1/20}
     <li>Element with class selector value for <em>cssNext</em> will load the
         next page to be loaded.</li>
     <li>Element with class selector value for <em>cssLast</em> will load the
         last page to be loaded.</li>
     <li>HTML select element with class selector value for <em>cssPageSize</em>
         encapsulates the number of rows to be displayed.</li>
 * </ul>
 *
 * Usage example: Consider the table element below.
 * <pre>
 * <table ....>
 * </table>
 * <div id="pager">
 *   <img src=".." class="first"/>
 *   <img src=".." class="prev" />
 *   <input type="text" class="pagedisplay"> <
 *   <img src=".." class="next" />
 *   <img src=".." class="last" />
 *   <select class="pagesize">
 *     <option value="10" selected="selected">10</option>
 *     <option value="20">20</option>
 *        .....
 *   </select>
 * </div>
 * </pre>
 * To initialize only pagination, the java script code is given below:
 * <pre>
 *   // Get the table element to be decorated.
 *   var tableElem = document.getElementsByTagName('table')[0];
 *   // Get the paginator element.
 *   var paginatorElem = document.getElementById('pager');
 *   // Initialize the pager element.
 *   var paginator = treasury.ui.Paginator(paginatorElem);
 *   // Decorate the table element with pagination.
 *   paginator.decorate(tableElem);
 * </pre>
 *
 * To enable table sorting with pagination,
 * <pre>
 *   var tableSorter = new goog.ui.TableSorter();
 *   var paginatorElem = document.getElementById('pager');
 *   var optionalPaginationOptions = {'cssFirst': 'firstPage'};
 *   var paginator =
 *       new treasury.ui.Paginator(
 *           paginatorElem, optionalPaginatorOptions, // Can be null as well.
 *           tableSorter);
 *    paginator.decorate(document.getElementsByTagName('table')[0]);
 * </pre>
 *
 * @param {!Element} paginationElement Pagination elements' container.
 * @param {Object=} opt_paginationOptions Optional configuration for paginator.
 *     The options include class selectors for HTML pagination elements such as
 *     "next" or "first" or "previous" button. This is useful if the defaults
 *     need to be overridden.
 * @param {(goog.ui.TableSorter|treasury.ui.MultiRowTableSorter)=}
 *     opt_tableSorter Optional table sorter implementation, should sorting be
 *     supported.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Component}
 */
treasury.ui.Paginator = function(
    paginationElement, opt_paginationOptions, opt_tableSorter, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * Initializes the pagination element.
   * @type {Element}
   * @private
   */
  this.paginationElement_ = paginationElement;

  /**
   * Initializes the pagionation options.
   * @type {!Object}
   * @private
   */
  this.paginationOptions_ = opt_paginationOptions || {};


  /**
   * Represents the class selector used to denote the element to be clicked in
   * order to display the "next" page.
   * @type {string}
   * @private
   */
  this.cssNext_ = this.paginationOptions_['cssNext'] || 'next';


  /**
   * Represents the class selector used to denote the element to be clicked in
   * order to display the "previous" page.
   * @type {string}
   * @private
   */
  this.cssPrev_ = this.paginationOptions_['cssPrev'] || 'prev';


  /**
   * Represents the class selector used to denote the element to be clicked in
   * order to display the "first" page.
   * @type {string}
   * @private
   */
  this.cssFirst_ = this.paginationOptions_['cssFirst'] || 'first';


  /**
   * Represents the class selector used to denote the element to be clicked in
   * order to display the "last" page.
   * @type {string}
   * @private
   */
  this.cssLast_ = this.paginationOptions_['cssLast'] || 'last';


  /**
   * Represents the class selector for HTML Select input field that encapsulates
   * all the options representing the number of rows to display per page.
   * @type {string}
   * @private
   */
  this.cssPageSize_ = this.paginationOptions_['cssPageSize'] || 'pagesize';


  /**
   * Represents the class selector for HTML Input text field that displays the
   * current page out of total number of pages i.e. "4/9" where "4" and "9"
   * represents the current page and the total number of pages respectively.
   * @type {string}
   * @private
   */
  this.cssPageDisplay_ =
      this.paginationOptions_['cssPageDisplay'] || 'pagedisplay';

  /**
   * Optional instance of table sorter if sorting is desired.
   * @type {goog.ui.TableSorter|treasury.ui.MultiRowTableSorter}
   * @private
   */
  this.tableSorter_ = opt_tableSorter || null;

  this.addComponentAsChild_(this.tableSorter_);
};
goog.inherits(treasury.ui.Paginator, goog.ui.Component);


/**
 * Represents the current page number to be displayed.
 * @type {number}
 * @private
 */
treasury.ui.Paginator.prototype.currentPageNumber_ = 1;


/**
 * Represents the total number of pages to be displayed.
 * @type {number}
 * @private
 */
treasury.ui.Paginator.prototype.totalPagesNumber_ = 1;


/**
 * Represents the number for the rows per page to be displayed.
 * @type {number}
 * @private
 */
treasury.ui.Paginator.prototype.rowsPerPage_ = 10;


/**
 * Sets the current page number.
 *
 * @param {number} currentPageNumber Current page number.
 */
treasury.ui.Paginator.prototype.setCurrentPageNumber =
    function(currentPageNumber) {
  this.currentPageNumber_ = currentPageNumber;
};


/**
 * Returns the current page number.
 * @return {number} Current page number.
 */
treasury.ui.Paginator.prototype.getCurrentPageNumber = function() {
  return this.currentPageNumber_;
};


/**
 * Sets the number of rows per page.
 *
 * @param {number} rowsPerPage Number of rows per page.
 */
treasury.ui.Paginator.prototype.setRowsPerPage = function(rowsPerPage) {
  this.rowsPerPage_ = rowsPerPage || this.rowsPerPage_;
};


/**
 * Returns the rows per page.
 *
 * @return {number} Number of rows per page.
 */
treasury.ui.Paginator.prototype.getRowsPerPage = function() {
  return this.rowsPerPage_;
};


/**
 * Set the total pages' number to be displayed.
 *
 * @param {number} totalPagesNumber Total number of pages to be displayed.
 */
treasury.ui.Paginator.prototype.setTotalPagesNumber =
    function(totalPagesNumber) {
  this.totalPagesNumber_ = totalPagesNumber;
};


/**
 * Returns the total pages' number to be displayed.
 *
 * @return {number} Total number of pages to be displayed.
 */
treasury.ui.Paginator.prototype.getTotalPagesNumber = function() {
  return this.totalPagesNumber_;
};


/**
 * Adds component as a child of the paginator component.
 *
 * @param {?goog.ui.Component} component Component to be added as a child of the
 * paginator.
 * @private
 */
treasury.ui.Paginator.prototype.addComponentAsChild_ = function(component) {
  if (component != null) {
    this.addChild(component);
  }
};


/**
 * Determines if the element can be decorated.
 *
 * @param {Element} element HTML element.
 * @return {boolean} true if the element can be decorated; false otherwise.
 * @override
 */
treasury.ui.Paginator.prototype.canDecorate = function(element) {
  return element.tagName == goog.dom.TagName.TABLE;
};


/**
 * Sets up initial pagination.
 *
 * @param {Element} element HTML element.
 * @override
 */
treasury.ui.Paginator.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  // The selected value indicating the number of pages to be displayed.
  // Get the page size element.
  var pageSizeElements =
      goog.dom.getElementsByTagNameAndClass(
      'select', this.cssPageSize_, this.paginationElement_);
  if (pageSizeElements != null && pageSizeElements.length > 0) {
    this.setRowsPerPage(parseInt(pageSizeElements[0].value, 10));
  }
  var tableRows = this.findTableRows_();
  var rowLength = this.findRowLength_(tableRows);
  this.setTotalPagesNumber(Math.ceil(rowLength / this.getRowsPerPage()));
  var pageDisplayElements =
      goog.dom.getElementsByTagNameAndClass(
      'input', this.cssPageDisplay_, this.paginationElement_);
  // Set the value as pageNumber/totalPages.
  this.showHideRows_();
  if (this.tableSorter_ != null) {
    this.tableSorter_.decorate(element);
  }
};


/**
 * Initializes all the listeners for pagination.
 *
 * @override
 */
treasury.ui.Paginator.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var handler = this.getHandler();

  // Set up listeners for an event if the user clicks the "first" element.
  var firstElem =
      goog.dom.getElementsByClass(this.cssFirst_, this.paginationElement_);
  if (!!firstElem) {
    handler.listen(
        firstElem[0], goog.events.EventType.CLICK, this.showFirstPage_, false,
        this);
  }

  // Set up listeners for an event if the user clicks on "next" element.
  var nextElem =
      goog.dom.getElementsByClass(this.cssNext_, this.paginationElement_);
  if (!!nextElem) {
    handler.listen(
        nextElem[0], goog.events.EventType.CLICK, this.showNextPage_, false,
        this);
  }

  // Set up listeners if the users click on the "prev" element.
  var prevElem =
      goog.dom.getElementsByClass(this.cssPrev_, this.paginationElement_);
  if (!!prevElem) {
    handler.listen(
        prevElem[0], goog.events.EventType.CLICK, this.showPrevPage_, false,
        this);
  }

  // Set up listeners if the users click on the "last" element.
  var lastElem =
      goog.dom.getElementsByClass(this.cssLast_, this.paginationElement_);
  if (!!lastElem) {
    handler.listen(
        lastElem[0], goog.events.EventType.CLICK, this.showLastPage_, false,
        this);
  }

  // Set up listeners if the users change the number of rows to be displayed per
  // page.
  var pageSizeElem =
      goog.dom.getElementsByTagNameAndClass(
          'select', this.cssPageSize_, this.paginationElement_);
  if (!!pageSizeElem) {
    handler.listen(
        pageSizeElem[0], goog.events.EventType.CHANGE, this.resetPage_, false,
        this);
  }

  // If the table sorting is complete, the table sorter dispatches a 'sort'
  // event.
  if (this.tableSorter_ != null) {
    handler.listen(this.tableSorter_, 'sort', this.rePaginate_, false, this);
  }
};


/**
 * Bound listener function that shows the first page.
 *
 * @param {!goog.events.Event} event Browser event.
 * @private
 */
treasury.ui.Paginator.prototype.showFirstPage_ = function(event) {
  event.preventDefault();
  this.setCurrentPageNumber(1);
  this.showHideRows_();
};


/**
 * Bound listener function that shows the next page.
 *
 * @param {!goog.events.Event} event Browser event.
 * @private
 */
treasury.ui.Paginator.prototype.showNextPage_ = function(event) {
  event.preventDefault();
  // Increment the page number.
  if (this.getCurrentPageNumber() < this.getTotalPagesNumber()) {
    this.setCurrentPageNumber(this.getCurrentPageNumber() + 1);
  }
  this.showHideRows_();
};


/**
 * Bound listener function that shows the prev page.
 *
 * @param {!goog.events.Event} event Browser event.
 * @private
 */
treasury.ui.Paginator.prototype.showPrevPage_ = function(event) {
  event.preventDefault();
  // If this is not the first page.
  if (this.getCurrentPageNumber() > 1) {
    this.setCurrentPageNumber(this.getCurrentPageNumber() - 1);
  }
  this.showHideRows_();
};


/**
 * Bound listener function that shows the "last" page.
 *
 * @param {!goog.events.Event} event Browser event.
 * @private
 */
treasury.ui.Paginator.prototype.showLastPage_ = function(event) {
  event.preventDefault();
  this.setCurrentPageNumber(this.getTotalPagesNumber());
  this.showHideRows_();
};


/**
 * Resets the total page display. The function shows the rows that are to be
 * displayed after the reordering.
 *
 * @param {!goog.events.Event} event Browser event.
 * @private
 */
treasury.ui.Paginator.prototype.resetPage_ = function(event) {
  event.preventDefault();
  var tableRows = this.findTableRows_();
  // Show the text value in pagedisplay element to be 1/totalPageNumber.
  var pageDisplayElem =
      goog.dom.getElementsByTagNameAndClass(
          'input', this.cssPageDisplay_, this.paginationElement_);
  if (!!pageDisplayElem) {
    pageDisplayElem = pageDisplayElem[0];
  }

  this.setRowsPerPage(parseInt(event.target.value, 10));

  this.setTotalPagesNumber(
      Math.ceil(this.findRowLength_(tableRows) / this.getRowsPerPage()));
  if (this.getCurrentPageNumber() >= this.getTotalPagesNumber()) {
    this.setCurrentPageNumber(this.getTotalPagesNumber());
  }
  this.showHideRows_();
};


/**
 * Repaginates the tables. This is to be invoked if the table rows have been
 * reordered for any reason such as table sorting.
 *
 * @param {!goog.events.BrowserEvent} event Bubbled browser event.
 * @private
 */
treasury.ui.Paginator.prototype.rePaginate_ = function(event) {
  event.preventDefault();
  this.showHideRows_();
};


/**
 * Shows the rows for a given page number and hides the other pages.
 *
 * The implementation also populates the "pageDisplay" element input type to
 * read "pageNumber/totalPageNumber".
 * @private
 */
treasury.ui.Paginator.prototype.showHideRows_ = function() {
  var tableRows = this.findTableRows_();
  var startIndex = (this.currentPageNumber_ - 1) * this.rowsPerPage_;
  var endIndex = this.currentPageNumber_ * this.rowsPerPage_ - 1;
  goog.array.forEach(tableRows, function(tableRow, idx) {
    tableRow.style.display =
        (idx >= startIndex && idx <= endIndex) ? '' : 'none';
  });
  var pageDisplayElems =
      goog.dom.getElementsByTagNameAndClass(
          'input', this.cssPageDisplay_, this.paginationElement_);
  if (pageDisplayElems != null && pageDisplayElems.length > 0) {
    var pageDisplayElem = pageDisplayElems[0];
    pageDisplayElem.value =
        [this.currentPageNumber_, this.totalPagesNumber_].join('/');
  }
};


/**
 * Returns an array of table body rows.
 *
 * @return {!Array.<Element>} array of table rows elements.
 * @private
 */
treasury.ui.Paginator.prototype.findTableRows_ = function() {
  return /** @type {!Array.<Element>} */ (goog.dom.getElementsByTagNameAndClass(
      'tbody tr', null, this.getElement()));
};


/**
 * Returns the length of table rows.
 *
 * @param {!Array.<Element>} tableRows an array of table rows.
 * @return {number} an array of table rows.
 * @private
 */
treasury.ui.Paginator.prototype.findRowLength_ = function(tableRows) {
  return tableRows.length;
};