/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-widgettoolbar', function(Y) {
    "use strict";

    /**
     *  @name Y.Wegas.WidgetToolbar
     *  @class Adds a toolbar to target Y.Widget
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var BOUNDINGBOX = "boundingBox", HOST = "host",
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
            //this.afterHostEvent("render", this.render, this);

            this.onHostEvent("*:message", function(e) {                         // Observe success messages,
                if (e.level === "success" && !e.timeout) {
                    this.setStatusMessage(e.content);                           // to display in the toolbar
                    e.halt(true);
                }
            });
        },
        /**
         * @function
         * @private
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.children.length; i = i + 1) {
                this.children[i].destroy();
            }
        },
        // *** Private methods *** //
        /**
         * @function
         * @private
         */
        render: function() {
            var i, host = this.get(HOST),
                    children = this.get("children");
            host.get(BOUNDINGBOX).addClass("wegas-hastoolbar")
                    .prepend('<div class="wegas-toolbar"><div class="wegas-toolbar-header"></div><div class="wegas-toolbar-panel"></div></div>');
            host.get('contentBox').addClass("wegas-toolbar-sibling");

            for (i = 0; i < children.length; i = i + 1) {
                this.add(children[i]);
            }
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
            if (!(widget instanceof Y.Widget)) {
                widget = Y.Wegas.Widget.create(widget);
            }
            widget.render(this.get("header"));
            widget.addTarget(this.get(HOST));
            this.children.push(widget);
            return widget;
        },
        /**
         * Returns a toolbar widget based on its index
         * @function
         * @param {Number} index
         * @returns {Y.Widget}
         */
        item: function(index) {
            return this.children[index];
        },
        size: function() {
            return this.children.length;
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
         * @description clear message (see function 'showMessage')
         */
        emptyMessage: function() {
            this.getStatusNode().empty();
        },
        /**
         * @function
         * @private
         * @param txt
         * @return Status node
         * @description get the status node of the message.
         * if 'wegas-status-message' doesn't exist, create and return it
         */
        getStatusNode: function() {
            var statusNode = this.get("header").one(".wegas-status-message");
            if (!statusNode) {
                statusNode = new Y.Node.create("<span class='wegas-status-message'></span>");
                this.get("header").append(statusNode);
            }
            return statusNode;
        },
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
    Y.namespace('Plugin').WidgetToolbar = WidgetToolbar;

});
