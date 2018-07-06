/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI/MEI
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
        showMessage: function(level, message, timeout) {
            Y.log("Wegas.Alerts.showMessage(" + level + ", " + message + ", " + timeout + ")");
            var node = this.getDisplayNode();
            if (node) {
                node.showMessage(level, message, timeout);
            } else {
                if (Y.Wegas.Panel) {
                    Y.Wegas.Panel.alert(message);
                } else {
                    window.alert(message);
                }
            }
        },
        getNotificationArea: function() {
            var notificationArea = Y.one("body > .wegas-notification-area");

            if (!notificationArea) {
                Y.one("body").prepend("<div class=\"wegas-notification-area\"></div>");
                notificationArea = Y.one("body > .wegas-notification-area");
            }

            return notificationArea;
        },
        showNotification: function(message, cfg) {
            var notificationArea = this.getNotificationArea();

            notificationArea.append("<div class=\"wegas-notification\"><span class=\"wegas-notification-icon fa fa-bullhorn fa-3x\"></span><span class=\"wegas-notification-message\">" + message + "</span></div>");

            // to be implemented:
            // cfg.duration : hide the notification after the given delay
            // cfg.ignorable: hide on click
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
                if (!el)
                    return false;                                  // Added: convenience for the caller
                if (el.getDOMNode) {
                    el = el.getDOMNode();
                }
                var rect = el.getBoundingClientRect();
                return (
                    rect.width !== 0 && // Added: the element may exist but be hidden by having its width set to zero.
                    rect.height !== 0 && // Idem for the height.
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
                    );
            },

        };
        Wegas.Alerts = Alerts;
    });
