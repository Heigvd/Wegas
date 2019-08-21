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
        getBannerArea: function() {
            var bannerArea = Y.one("body > .wegas-banner-area");

            if (!bannerArea) {
                Y.one("body").prepend("<div class=\"wegas-banner-area\"></div>");
                bannerArea = Y.one("body > .wegas-banner-area");
            }

            return bannerArea;
        },
        showBanner: function(message, cfg) {
            var bannerArea = this.getBannerArea();
            cfg = cfg || {};

            var notif = bannerArea.appendChild("<div class=\"wegas-banner " + (cfg.className || "warning")+ "\">"
                + (cfg.iconCss ? "<span class=\"wegas-banner-icon " + cfg.iconCss + "\"></span>" : "")
                + "<span class=\"wegas-banner-message\">" + message + "</span></div>");
        },
        getNotificationArea: function() {
            var notificationArea = Y.one("body > .wegas-notification-area");

            if (!notificationArea) {
                Y.one("body").prepend("<div class=\"wegas-notification-area\"></div>");
                notificationArea = Y.one("body > .wegas-notification-area");
                notificationArea.delegate("click", this.onClose, ".wegas-notification", this);
            }

            return notificationArea;
        },
        onClose: function(e) {
            this.closeNotification(e.currentTarget);
        },
        closeNotification: function(node) {
            node.addClass("fadeout");
            Y.later(1000, this, function() {
                this.getNotificationArea().removeChild(node);
            });
        },
        showNotification: function(message, cfg) {
            var notificationArea = this.getNotificationArea();

            var timeout = cfg && cfg.timeout;
            var iconCss = cfg && cfg.iconCss;

            var notif = notificationArea.appendChild("<div class=\"wegas-notification\">"
                + (iconCss ? "<span class=\"wegas-notification-icon " + iconCss + "\"></span>" : "")
                + "<span class=\"wegas-notification-message\">" + message + "</span></div>");

            if (timeout && timeout > 0) {
                Y.later(timeout, this, this.closeNotification, notif);
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
