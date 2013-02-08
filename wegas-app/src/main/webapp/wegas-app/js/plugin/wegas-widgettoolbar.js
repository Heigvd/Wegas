/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-widgettoolbar', function (Y) {
    "use strict";

    /**
     *  @name Y.Wegas.WidgetToolbar
     *  @class Adds a toolbar to target Y.Widget
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var  WidgetToolbar = function () {
        WidgetToolbar.superclass.constructor.apply(this, arguments);
    };

    Y.extend(WidgetToolbar, Y.Plugin.Base, {
        /** @lends Y.Wegas.WidgetToolbar */

        // *** Lifecycle methods *** //
        /**
         * @function
         * @private
         */
        initializer: function () {
            this.children = [];
            this.render();
        //this.afterHostEvent("render", this.render, this);
        },

        /**
         * @function
         * @private
         */
        destructor: function () {
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
        render: function () {
            var i, host = this.get("host"),
            children = this.get("children");
            host.get('boundingBox').addClass("wegas-hastoolbar")
            .append('<div class="wegas-toolbar"><div class="wegas-toolbar-header"></div><div class="wegas-toolbar-panel"></div></div>');
            host.get('contentBox').addClass("wegas-toolbar-sibling");

            for (i = 0; i < children.length; i = i + 1) {
                this.children.push(this.add(children[i]));
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
        add: function (widget) {
            if (!(widget instanceof Y.Widget)) {
                widget = Y.Wegas.Widget.create(widget);
            }
            widget.render(this.get("header"));
            widget.addTarget(this.get("host"));
            return widget;
        },
        
        /**
         * Returns a toolbar widget based on its index
         * @function
         * @param {Number} index
         * @returns {Y.Widget}
         */
        item: function (index) {
            return this.children[index];
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
                getter : function () {
                    return this.get("host").get('boundingBox').one(".wegas-toolbar-header");
                }
            },
            panel: {
                lazyAdd: false,
                value: false,
                getter : function () {
                    return this.get("host").get('boundingBox').one(".wegas-toolbar-panel");
                }
            }
        }
    });
    Y.namespace('Plugin').WidgetToolbar = WidgetToolbar;

});
