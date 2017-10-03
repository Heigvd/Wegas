/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2017 School of Business and Engineering Vaud, Comem/MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview A module for displaying alert messages with as few dependencies as possible and with fallback mechanisms.
 * @author jarle.hulaas@heig-vd.ch
 */

YUI.add('wegas-alerts', function(Y) {
    "use strict";

    var Wegas = Y.namespace("Wegas"),
        Alerts;

    Alerts = {

        // Displays the given message to the player (the trainer dashboard is not targeted here).
        showMessage: function(level, message) {
            Y.log("Wegas.Alerts.showMessage(" + level + ", " + message + ")");
            var node = this.getDisplayNode();
            if (node) {
                node.showMessage(level, message);
            } else {
                if (Y.Wegas.Panel) {
                    Y.Wegas.Panel.alert(message);
                } else {
                    window.alert(message);
                }
            }
        },

        // Returns the widget node where the alert should be displayed to the player (not to the trainer).
        // Returns undefined if not possible, e.g. if required libraries are not yet loaded.
        // NB: if the widget node exists but is hidden, the alert might not be visible !
        getDisplayNode: function() {
            if (Y.Widget) {
                var node =
                    // This one seems currently unused:
                    Y.Widget.getByNode(".wegas-login-page") ||
                    // Choose the player view if it exists and is visible:
                    (this.isElementVisible(Y.one(".wegas-playerview")) && Y.Widget.getByNode(".wegas-playerview")) ||
                    // Fallback: take the scenario editor if it's open (we don't care which tabViews are actually visible,
                    // but in fullscreen mode, the message will not be visible with this fallback) :
                    Y.Widget.getByNode(".wegas-editview");
                return node;
            } else {
                return undefined;
            }
        },

        /**
         * @function
         * source: https://stackoverflow.com/a/7557433/5628         Article updated on May 23, 2017
         * @param {type} el
         * @returns {Boolean}
         */
        isElementVisible: function(el) {
            if (!el) return false;                                  // Added: convenience for the caller
            if (el.getDOMNode) {
                el = el.getDOMNode();
            }
            var rect = el.getBoundingClientRect();
            return (
                rect.width !== 0 &&    // Added: the element may exist but be hidden by having its width set to zero.
                rect.height !== 0 &&   // Idem for the height.
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            );
        },

    };
    Wegas.Alerts = Alerts;
});
