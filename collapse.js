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
 * @fileoverview Implements the accordion like set up without having to use
 * zippy or animated zippy modules. The implementation toggles classes
 * <em>collapse</em> and <em>expand</em> to denote if the elements have
 * collapsed or expanded.
 * @author kartik (Kartik Krishnanand)
 */


goog.provide('treasury.ui.Collapse');

goog.require('goog.array');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');



/**
 * Implements the collapse and expand of a particular HTML element. Although,
 * {@link goog.ui.Zippy} and {@link goog.ui.AnimatedZippy} are capable of
 * performing the same functions, it is required to configure the element that
 * will {@code zipped} or {@code unzipped} explicitly. This implementation
 * is capable of inferring the same from event target's data attributes.
 *
 * This implementation aims to use data attributes to determine a list(s) of
 * elements to be expanded or collapsed.
 * @param {!Array.<Element>} selectors Element to be bound to a listener.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM Helper.
 * @extends {goog.ui.Component}
 * @constructor
 */
treasury.ui.Collapse = function(selectors, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * HTML element representing the source to bind the element to.
   * @type {!Array.<Element>}
   * @private
   */
  this.selectors_ = selectors;
};
goog.inherits(treasury.ui.Collapse, goog.ui.Component);


/**
 * Registers the listeners to be invoked when collapse event is triggered.
 *
 * The implementation assumes the following:
 * <ul>
 *  <li>If the event source has a data attribute named {@code parent}, then its
 * value represents the DOM element selector for the parent. Valid examples
 * include {@code #foo} for element id or {@code .foo} for element class
 * selector.</li>
 * <li>If the event source has a data attribute named {@code target}, then
 * a element associated with the selector is to be shown or hidden.</li>
 * <li>If the event source has a data attribute named {@code collapse}, then
 * other expanded nodes should be collapsed. Otherwise, they will remain as are.
 * </li>
 * </ul>
 *
 * @override
 */
treasury.ui.Collapse.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  goog.array.forEach(this.selectors_, function(selector) {
    this.getHandler().listen(selector, 'click', this.toggle_, false, this);
  }, this);
};


/**
 * This function is responsible for dispatching an event to expand or collapse
 * the toggle element. The implementation relies on the data attributes to
 * determine the logical flow:
 * <ul>
 *  <li>{@code parent} represents the selector of element(s) to act as a
 * parent. This is particularly useful if the other expanded elements are to be
 * collapsed if triggered element is to be expanded.</li>
 * <li>{@code target} represents the element selector to identify the multiple
 * event targets.</li>
 * <li>{@code collapse} if true; collapses all items having the class selector
 * equal to {@code collapsible}.</li>
 * </ul>
 *
 * @param {!goog.events.BrowserEvent} event Bubbled browser event triggered.
 * @private
 */
treasury.ui.Collapse.prototype.toggle_ = function(event) {
  event.preventDefault();
  var eventTarget = event.target;
  var dataset = eventTarget.dataset;
  var parentElement =
      /** @type {!Node} */ (this.queryElement_(dataset.parent));
  var targets =
      /** @type {!Array.<Element>} */ (goog.array.toArray(this.queryElementAll_(
          dataset.target, parentElement)));
  var collapseValue = dataset.collapse || false;
  var collapse = !!collapseValue && collapseValue == 'true';
  var collapsibleElements =
      this.queryElementAll_('.collapsible', parentElement);
  // Separate the targets to be expanded vs collapsed.
  // This is useful if any events have to be dispatched afterwards.
  var targetsToBeExpanded = [];
  var targetsToBeCollapsed = [];
  goog.array.forEach(targets, function(target) {
    if (goog.dom.classes.has(target, 'collapsible') &&
        goog.dom.classes.has(target, 'show-empty')) {
      targetsToBeCollapsed.push(target);
    } else {
      targetsToBeExpanded.push(target);
    }
  }, this);
  // Dispatch events to be implemented if the elements are shown or hidden.
  this.resetCollapsible_(collapsibleElements, collapse);
  this.collapseOrExpand_(targetsToBeExpanded, targetsToBeCollapsed);
  this.resetExpandCollapseSelector_(eventTarget);
};


/**
 * Expands and collapses the elements appropriately.
 *
 * @param {!Array.<Element>} targetsToBeExpanded Elements to be expanded.
 * @param {!Array.<Element>} targetsToBeCollapsed Elements to be collapsed.
 * @private
 */
treasury.ui.Collapse.prototype.collapseOrExpand_ =
    function(targetsToBeExpanded, targetsToBeCollapsed) {
  if (targetsToBeCollapsed.length > 0) {
    this.hide_(targetsToBeCollapsed);
  }
  if (targetsToBeExpanded.length > 0) {
    this.show_(targetsToBeExpanded);
  }
};


/**
 * Collapses the target elements and invokes an optional event to be dispatched
 * after the targets are hidden.
 *
 * @param {!Array.<Element>} targetsToBeCollapsed Elements to be collapsed.
 * @private
 */
treasury.ui.Collapse.prototype.hide_ = function(targetsToBeCollapsed) {
  // Reset the "collapsible" elements.
  if (!!targetsToBeCollapsed && targetsToBeCollapsed.length > 0) {
    goog.array.forEach(targetsToBeCollapsed, function(targetToBeCollapsed) {
      goog.dom.classes.add(targetToBeCollapsed, 'hide');
      goog.dom.classes.remove(targetToBeCollapsed, 'show-empty', 'collapsible');
    }, this);
  }
  this.dispatchEvent('hidden');
};


/**
 * Collapses the target elements and invokes an optional event to be dispatched
 * after the targets are shown.
 *
 * @param {!Array.<Element>} targetsToBeExpanded Elements to be collapsed.
 * @private
 */
treasury.ui.Collapse.prototype.show_ = function(targetsToBeExpanded) {
  if (!!targetsToBeExpanded && targetsToBeExpanded.length > 0) {
    goog.array.forEach(targetsToBeExpanded, function(targetToBeExpanded) {
      goog.dom.classes.addRemove(
          targetToBeExpanded, ['hide'], ['show-empty', 'collapsible']);
    }, this);
  }
  this.dispatchEvent('shown');
};


/**
 * Collapses the other elements optionally based on the collapse flag value and
 * invokes an optional event to be dispatched.
 *
 * @param {NodeList|Node|null} collapsibleElements List of collapsible elements
 *     that could be collapsed.
 * @param {boolean} collapse Flag to denote if the elements should be collapsed.
 * @private
 */
treasury.ui.Collapse.prototype.resetCollapsible_ =
    function(collapsibleElements, collapse) {
  if (collapse && collapsibleElements) {
    goog.array.forEach(
        /** @type {goog.array.ArrayLike} */ (collapsibleElements),
        function(collapsibleElement) {
          goog.dom.classes.addRemove(
              collapsibleElement, ['collapsible', 'show-empty'], 'hide');
        }, this);
    this.dispatchEvent('collapsed');
  }
};


/**
 * Returns the element from the parent or the document for a given selector.
 *
 * @param {string} selector Element selector.
 * @param {Node=} opt_target Optional element target is available.
 * @return {?Node} Selected element for a selector.
 * @private
 */
treasury.ui.Collapse.prototype.queryElement_ = function(selector, opt_target) {
  var target = opt_target || null;
  if (goog.isDefAndNotNull(target)) {
    return target.querySelector(selector) || document.querySelector(selector);
  }
  return document.querySelector(selector);

};


/**
 * Returns all elements from the parent or the document for a given selector.
 *
 * @param {string} selector Element selector.
 * @param {Node=} opt_target Optional Element target if available.
 * @return {NodeList} Selected element for a selector.
 * @private
 */
treasury.ui.Collapse.prototype.queryElementAll_ =
    function(selector, opt_target) {
  var target = opt_target || null;
  if (goog.isDefAndNotNull(target)) {
    return target.querySelectorAll(selector) ||
        document.querySelectorAll(selector);
  }
  return document.querySelectorAll(selector);
};


/**
 * Resets the event target (element which triggered an event) class list.
 *
 * If the element had a class {@code collapse} associated with it, then it is
 * reset to {@code expand} and vice versa.
 *
 * @param {!Node} eventTarget Element that triggered a browser event.
 * @private
 */
treasury.ui.Collapse.prototype.resetExpandCollapseSelector_ =
    function(eventTarget) {
  // Change the class selector from expand to collapse for the event target.
  // Reset the element selector that has been previously set to "expanded".
  var expandedElements = document.querySelectorAll('.collapse');
  goog.array.forEach(expandedElements, function(expandedElement) {
    if (expandedElement != eventTarget) {
      goog.dom.classes.addRemove(expandedElement, 'collapse', 'expand');
    }
  }, this);
  if (goog.dom.classes.has(eventTarget, 'collapse')) {
    goog.dom.classes.addRemove(eventTarget, 'collapse', 'expand');
  } else {
    goog.dom.classes.addRemove(eventTarget, 'expand', 'collapse');
  }
};