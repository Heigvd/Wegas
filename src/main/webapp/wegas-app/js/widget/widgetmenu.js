/*
 * Wegas
 *
 * http://www.albasim.com/wegas/
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('widgetmenu', function (Y) {
    "use strict";

    /**
     *  @class WidgetMenu
     *  @module Wegas
     *  @constructor
     */
    var Menu, WidgetMenu = function () {
        WidgetMenu.superclass.constructor.apply(this, arguments);
    };

    Y.mix(WidgetMenu, {
        NS: "wegas",
        NAME: "WidgetMenu"
    });

    Y.extend(WidgetMenu, Y.Plugin.Base, {

        // *** Lifecycle methods *** //
        initializer: function () {
            this.doAfter("renderUI", this.render, this);
        },

        render: function () {
            var host = this.get("host");
            host.on("click", function () {
                var i, menu = this.getMenu(),
                children = this.get("children");

                menu.set("align",{
                    node: host.get("contentBox"),
                    points: ["tl", "bl"]
                });
                this.showMenu();
                //menu.removeAll();
                for (i = 0; i < children.length; i++) {
                    try {
                        menu.add(children[i]);
                    } catch(err) {
                        Y.error("Error while adding subpage to tab (probably du to absence of Y.WidgetChild in config", err, WidgetMenu);
                    }
                }
            }, this);
            host.on("mouseleave", this.startMenuHideTimer, this);
        },

        // *** Private methods *** //

        getMenu: function () {
            //console.log()
            if (!WidgetMenu.menu) {
                WidgetMenu.menu = new Menu({
                    width:"10em",
                    zIndex:1
                });
                WidgetMenu.menu.on("mouseenter", this.cancelMenuTimer, this);
                WidgetMenu.menu.on("mouseleave", this.startMenuHideTimer, this);
                WidgetMenu.menu.render();
            }
            return WidgetMenu.menu;
        },
        showMenu: function () {
            this.cancelMenuTimer();
            this.getMenu().show();
        // Y.one("body").once("click", this.hideMenu, this);
        },
        hideMenu: function () {
            if (WidgetMenu.menu) {
                WidgetMenu.menu.hide();
            }
        },
        startMenuHideTimer: function () {
            this.cancelMenuTimer();
            this.timer = Y.later(500, this, this.hideMenu);
        },
        cancelMenuTimer: function () {
            if (this.timer) {
                this.timer.cancel();
            }
        }
    }, {
        ATTRS: {
            children: {
                value: []
            }
        },
        menu: null,
        timer: null
    });

    Y.namespace('Plugin').WidgetMenu = WidgetMenu;

    Menu = Y.Base.create("menu", Y.Widget, [Y.WidgetPosition,  Y.WidgetPositionAlign, Y.WidgetStack, Y.WidgetParent]);
});


