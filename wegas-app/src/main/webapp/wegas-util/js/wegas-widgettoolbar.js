/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-widgettoolbar", function(Y) {
    "use strict";

    var BOUNDINGBOX = "boundingBox", HOST = "host",
        WidgetToolbar;

    /**
     *  @name Y.Wegas.WidgetToolbar
     *  @class Adds a toolbar to target Y.Widget
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    WidgetToolbar = function() {
        WidgetToolbar.superclass.constructor.apply(this, arguments);
    };

    Y.extend(WidgetToolbar, Y.Plugin.Base, {
        /** @lends Y.Wegas.WidgetToolbar */

        // *** Lifecycle methods *** //
        /**
         * @function
         * @private
         */
        initializer: function() {
            this.children = [];
            this.render();
            //this.messageTimer = new Y.Wegas.Timer({
            //    duration: 2000
            //});
            //his.messageTimer.on("timeOut", this.setStatusMessage, this, "");
            //this.afterHostEvent("render", this.render, this);

            this.onHostEvent("*:message", function(e) {                         // Observe success messages,
                if (e.level === "success") {
                    this.setStatusMessage(e.content);                           // to display in the toolbar
                    //this.messageTimer.reset();
                    e.halt(true);
                } else {
                    this.emptyMessage();
                }
            });
        },
        /**
         * @function
         * @private
         */
        destructor: function() {
            //this.messageTimer.destroy();
            this.menuBar.destroy();
            this.get(HOST).get("contentBox").removeClass("wegas-toolbar-sibling");
            this.get(HOST).get(BOUNDINGBOX).removeClass("wegas-hastoolbar").all(".wegas-toolbar").remove(true);
        },
        // *** Private methods *** //
        /**
         * @function
         * @private
         */
        render: function() {
            var host = this.get(HOST),
                bb = host.get(BOUNDINGBOX);

            bb.addClass("wegas-hastoolbar").prepend('<div class="wegas-toolbar"></div>');
            host.get("contentBox").addClass("wegas-toolbar-sibling");

            this.menuBar = new Y.Wegas.MenuBar({
                children: this.get("children")
                    //srcNode: bb.one(".wegas-toolbar-header"),
                    //render: true
            });
            this.menuBar.on(["*:message", "*:showOverlay", "*:hideOverlay"], host.fire, host);
            //this.menuBar.addTarget(host);
            this.menuBar.render(bb.one(".wegas-toolbar"));
            this.menuBar.get(BOUNDINGBOX).addClass("wegas-toolbar-header");

            bb.one(".wegas-toolbar").append('<div class="wegas-toolbar-panel"></div>');
        },
        /**
         *
         * Adds a widget to the toolbar
         *
         * @function
         * @param {Y.Widget|Object} widget A widget instance or an widget cfg object to be instantiated
         * @return {Y.Widget} the newly created widget
         */
        add: function(widget) {
            return this.menuBar.add(widget);
        },
        /**
         * Returns a toolbar widget based on its index
         * @function
         * @param {Number} index
         * @returns {Y.Widget}
         */
        item: function(index) {
            return this.menuBar.item(index);
        },
        size: function() {
            return this.menuBar.size();
        },
        remove: function(index) {
            return this.menuBar.remove(index);
        },
        removeAll: function() {
            return this.menuBar.removeAll();
        },
        destroyAll: function() {
            return this.menuBar.destroyAll();
        },
        /**
         * @function
         * @private
         * @param txt
         * @return boolean true is status is set.
         * @description set content of the message.
         */
        setStatusMessage: function(txt) {
            this.getStatusNode().setContent(txt);
        },
        /**
         * @function
         * @private
         * @description clear message (see function "showMessage")
         */
        emptyMessage: function() {
            this.getStatusNode().setContent("");
        },
        /**
         * @function
         * @private
         * @return Status node
         * @description get the status node of the message.
         * if 'wegas-status-message' doesn't exist, create and return it
         */
        getStatusNode: function() {
            var statusNode = this.get("header").one(".wegas-status-message");
            if (!statusNode) {
                statusNode = new Y.Node.create('<span class="wegas-status-message"></span>');
                this.get("header").append(statusNode);
            }
            return statusNode;
        }
    }, {
        /** @lends Y.Plugin.WidgetToolbar */
        NS: "toolbar",
        NAME: "toolbar",
        /**
         * <p><strong>Config attributes</strong></p>
         * <ul>
         *    <li>children {Y.Widget[]} A list of all widgets contained in the toolbar</li>
         *    <li>header {Y.Node} The main toolbar node</li>
         *    <li>panel {Y.Node} The panel node, visible on mouse over</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            children: {
                value: []
            },
            header: {
                lazyAdd: false,
                value: false,
                getter: function() {
                    return this.get(HOST).get(BOUNDINGBOX).one(".wegas-toolbar-header");
                }
            },
            panel: {
                lazyAdd: false,
                value: false,
                getter: function() {
                    return this.get(HOST).get(BOUNDINGBOX).one(".wegas-toolbar-panel");
                }
            }
        }
    });
    Y.Plugin.WidgetToolbar = WidgetToolbar;

});
