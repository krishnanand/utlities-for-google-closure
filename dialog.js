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
 * @fileoverview Implements a non-blocking modal ui dialog.
 *
 * <p>The modal dialog can be used to confirm a potentially state changing
 * action, such as deleting a record. The modal can be dismissed by either
 * pressing the <code>ESC</code> key, or clicking the dismiss button.
 *
 * <p>If the state changing action is to be proceed, then an event is dispatched
 * that the event proceed. The dialog implementation by itself is agnostic about
 * the impact of any of the decision made.
 *
 * @author kartik@ (Kartik Krishnanand)
 */

goog.provide('treasury.ui.ModalDialog');
goog.provide('treasury.ui.ModalEventType');

goog.require('goog.asserts');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');



/**
 * Constructor to handle modal dialogs.
 *
 * @param {(Node|Element)} modalElement HTML element or node that needs to be
 *     displayed or hidden.
 * @param {(Node|Element)} openModalElement HTML element or node that is
 *     clicked or tapped to show a modal dialog.
 * @param {?(Node|Element)} deactivateModalElement HTML element or node that is
 *     clicked or tapped to deactivate the modal dialog.
 * @param {(Node|Element)=} opt_actionModalElement HTML element or node that is
 *     clicked or tapped to trigger the request.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
treasury.ui.ModalDialog =
    function(
        modalElement, openModalElement, deactivateModalElement,
        opt_actionModalElement) {
  goog.base(this);

  goog.asserts.assertElement(modalElement, 'Modal element can not be invalid.');

  /**
   * HTML modal element or node that needs to be displayed.
   * @type {(Node|Element)}
   * @private
   */
  this.modalElement_ = modalElement;

  goog.asserts.assertElement(
      openModalElement,
      'The modal dialog can not be triggered by any element.');

  /**
   * HTML modal element or node that needs to be clicked to display the modal
   * dialog.
   * @type {(Node|Element)}
   * @private
   */
  this.openModalElement_ = openModalElement;

  /**
   * HTML modal element or node that if clicked will deactivate the modal
   *     dialog.
   * @type {?(Node|Element)}
   * @private
   */
  this.deactivateModalElement_ = deactivateModalElement || null;

  /**
   * HTML modal element or node that if clicked will trigger the modal action.
   * @type {(Node|Element)}
   * @private
   */
  this.actionModalElement_ = opt_actionModalElement || null;

  /**
   * Event handler handling the modal events.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.handler_ = new goog.events.EventHandler(this);
};
goog.inherits(treasury.ui.ModalDialog, goog.events.EventTarget);


/**
 * Modal dialog events.
 * @enum {string}
 */
treasury.ui.ModalEventType = {
  MODALACTIVATED: 'modalactivated',
  MODALDEACTIVATED: 'modaldeactivated',
  MODALACTION: 'modalaction'
};


/**
 * Initializes modal events.
 */
treasury.ui.ModalDialog.prototype.initializeModalEvents = function() {
  var events = ['click', 'touchstart'];
  if (!!this.modalElement_) {
    if (!!this.openModalElement_) {
      this.handler_.listen(
          this.openModalElement_, events, this.showModalDialog_, false, this);
    }
    if (!!this.deactivateModalElement_) {
      this.handler_.listen(
          this.deactivateModalElement_, events, this.deactivateModalDialog_,
          false, this);
    }
    if (!!this.actionModalElement_) {
      this.handler_.listen(
          this.actionModalElement_, events, this.initiateAction_, false, this);
    }
  }
  this.handler_.listen(document, 'keyup', this.handleKeyUpEvents_, false, this);
  // Check for clicks outside of the modal.
  this.handler_.listen(document, 'click', this.handleDocumentClick_, false,
      this);
};


/**
 * Disposes the registered events.
 *
 * @override
 */
treasury.ui.ModalDialog.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.handler_.dispose();
};


/**
 * Deactivates the modal on <code>ESC</code> key. All other keys are ignored.
 *
 * @param {!goog.events.BrowserEvent} event triggered event
 * @private
 */
treasury.ui.ModalDialog.prototype.handleKeyUpEvents_ = function(event) {
  if (event.keyCode == 27) {
    this.deactivateModal_();
    this.dispatchEvent(treasury.ui.ModalEventType.MODALDEACTIVATED);
  }
};


/**
 * Initializes the modal action by adding class selectors.
 *
 * @param {!goog.events.BrowserEvent} event bubbled browser event
 * @private
 */
treasury.ui.ModalDialog.prototype.showModalDialog_ = function(event) {
  this.activateModal_();
  this.dispatchEvent(treasury.ui.ModalEventType.MODALACTIVATED);
};


/**
 * Deactives the modal dialog.
 *
 * @param {!goog.events.BrowserEvent} event bubbled event
 * @private
 */
treasury.ui.ModalDialog.prototype.deactivateModalDialog_ = function(event) {
  this.deactivateModal_();
  this.dispatchEvent(treasury.ui.ModalEventType.MODALDEACTIVATED);
};


/**
 * Initiates the action that should be triggered on pressing the action button.
 *
 * @param {!goog.events.BrowserEvent} event bubbled browser event
 * @private
 */
treasury.ui.ModalDialog.prototype.initiateAction_ = function(event) {
  this.dispatchEvent(treasury.ui.ModalEventType.MODALACTION);
};


/**
 * Handles a scenario if the user clicks on any HTML target besides the action
 * elements. The modal dialog is closed if the user clicks anywhere but the
 * modal dialog target or the {@code open modal} element.
 *
 * @param {!goog.events.BrowserEvent} event bubbled event
 * @private
 */
treasury.ui.ModalDialog.prototype.handleDocumentClick_ = function(event) {
  var target = event.target;
  if (target == this.deactivateModalElement_ ||
      (target != this.modalElement_ &&
       target.parentNode != this.modalElement_ &&
       target != this.openModalElement_)) {
    this.deactivateModal_();
    this.dispatchEvent(treasury.ui.ModalEventType.MODALDEACTIVATED);
  }
};


/**
 * Activates modal dialog.
 *
 * @private
 */
treasury.ui.ModalDialog.prototype.activateModal_ = function() {
  this.addClass_(this.modalElement_, 'modal-ready-popup-animate');
  this.addClass_(this.modalElement_, 'no-transition');
  setTimeout(goog.bind(function() {
    this.removeClass_(this.modalElement_, 'no-transition');
  }, this), 0);
};


/**
 * Deactivates the modal dialog.
 *
 * <p>This function is deliberately public because it might be required to
 * deactivate the modal if the event triggered by clicking or tapping on the
 * action element has been activated.
 *
 * @private
 */
treasury.ui.ModalDialog.prototype.deactivateModal_ = function() {
  this.removeClass_(this.modalElement_, 'modal-ready-popup-animate');
};


/**
 * Adds the class selector to the element.
 *
 * @param {(Element|Node)} element element to which the class selector is to be
 *     added
 * @param {string} classSelector class selector to be added
 * @private
 */
treasury.ui.ModalDialog.prototype.addClass_ = function(element, classSelector) {
  if (!!element) {
    element.classList.add(classSelector);
  }
};


/**
 * Removes the class selector from the element.
 *
 * @param {(Element|Node)} element element from which the class selector is to
 *     be removed
 * @param {string} classSelector class selector to be added
 * @private
 */
treasury.ui.ModalDialog.prototype.removeClass_ =
    function(element, classSelector) {
  if (!!element) {
    element.classList.remove(classSelector);
  }
};