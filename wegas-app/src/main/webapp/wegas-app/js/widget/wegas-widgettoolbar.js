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

YUI.add('wegas-widgettoolbar', function (Y) {
    "use strict";

    /**
     *  @class Wegas.WidgetToolbar
     *  @module Wegas
     *  @constructor
     */
    var  WidgetToolbar = function () {
        WidgetToolbar.superclass.constructor.apply(this, arguments);
    };

    WidgetToolbar.NS = "toolbar";
    WidgetToolbar.NAME = "toolbar";


    Y.extend(WidgetToolbar, Y.Plugin.Base, {

        // *** Lifecycle methods *** //

        initializer: function () {
            //            var host = this.get("host");
            //            this.afterHostEvent("render", function () {
            //
            //                }, this);
            this.render();
        },

        destructor: function () {
            var i, children = this.get("children");
            for (i = 0; i < children.length; i = i + 1) {
                children[i].destroy();
            }
        },


        // *** Private methods *** //
        render: function () {
            var i, host = this.get("host"),
            bb = host.get('boundingBox'),
            children = this.get("children");

            bb.append('<div class="wegas-toolbar"><div class="wegas-toolbar-header"></div><div class="wegas-toolbar-panel"></div></div>');
            host.get('contentBox').setStyles({
                position: "absolute",
                bottom: "26px",
                overflow: "auto",
                padding: "0",
                left: "0px",
                right: "0px",
                top: "31px"
            });

            for (i = 0; i < children.length; i = i + 1) {
                children[i] = this.add(children[i]);
            }
        },

        add: function (widget) {
            if (!(widget instanceof Y.Widget)) {
                widget = Y.Wegas.Widget.create(widget);
            }
            widget.render(this.get("header"));
            widget.addTarget(this.get("host"));
            return widget;
        }

    }, {
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


