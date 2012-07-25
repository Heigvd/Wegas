/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('widgetmenu', function (Y) {
    "use strict";

    /**
     *  @class WidgetMenu
     *  @module Wegas
     *  @constructor
     */
    var  WidgetMenu = function () {
        WidgetMenu.superclass.constructor.apply(this, arguments);
    };

    Y.mix(WidgetMenu, {
        NS: "wegas",
        NAME: "WidgetMenu"
    });

    Y.extend(WidgetMenu, Y.Plugin.Base, {

        // *** Lifecycle methods *** //
        initializer: function () {
            this.afterHostEvent("click", function () {
                var menu = this.getMenu();

                menu.attachTo(this.get("host").get("contentBox"));
                menu.removeAll();
                try {
                    menu.add(this.get("children"));
                } catch(err) {
                    Y.error("Error while adding subpage to tab (probably du to absence of Y.WidgetChild in config", err, WidgetMenu);
                }
            }, this);
        },

        // *** Private methods *** //

        getMenu: function () {
            if (!WidgetMenu.menu) {
                WidgetMenu.menu = new Y.Wegas.Menu();
            }
            return WidgetMenu.menu;
        }
    }, {
        ATTRS: {
            children: {
                value: []
            }
        },
        menu: null
    });

    Y.namespace('Plugin').WidgetMenu = WidgetMenu;

    Y.namespace('Wegas').Menu = Y.Base.create("menu", Y.Widget,
        [Y.WidgetPosition,  Y.WidgetPositionAlign, Y.WidgetStack, Y.WidgetParent, Y.WidgetPositionConstrain], {

        // *** private fields *** //

        timer: null,

        // *** Lifecycle methods *** //

        renderUI: function () {
            var cb = this.get("boundingBox");

            // cb.on("clickoutside", this.hideMenu, this);
            cb.on("click", this.hide, this);
            cb.on("mouseenter", this.cancelMenuTimer, this);
            cb.on("mouseleave", this.startMenuHideTimer, this);
        },

        // *** Public methods *** //

        /**
         *
         *  Displays the menu next to the provided node and add mouseenter and
         *  mouseleave callbacks to the node
         *
         * @method attachTo
         */
        attachTo: function ( node ) {
            this.cancelMenuTimer();
            this.show();

            // node.on("mouseenter", this.cancelMenuTimer, this);
            // node.on("mouseleave", this.startMenuHideTimer, this);
            this.set("align",{
                node: node,
                points: ["tl", "bl"]
            });
        },

        // *** Private methods *** //
        startMenuHideTimer: function () {
            this.cancelMenuTimer();
            this.timer = Y.later(500, this, this.hide);
        },
        cancelMenuTimer: function () {
            if (this.timer) {
                this.timer.cancel();
            }
        }
    }, {
        ATTRS: {
            constrain: {
                value: true
            },
            zIndex:{
                value: 1
            },
            width: {
                value: "12em"
            },
            render: {
                value: true
            },
            visible: {
                value: false
            }
        }
    });
});


