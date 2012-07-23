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

YUI.add('wegas-editor-action', function (Y) {
    "use strict";

    /**
     *  @class OpenTabAction
     *  @module Wegas
     *  @constructor
     */
    var OpenTabAction = function () {
        OpenTabAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(OpenTabAction, {
        NS: "wegas",
        NAME: "OpenTabAction"
    });

    Y.extend(OpenTabAction, Y.Plugin.Base, {

        tab: null,

        initializer: function () {
            this.doAfter("bindUI", this.bindUI, this);
        },
        bindUI: function () {
            this.get("host").on("click", function() {
                var host = this.get("host"),
                tab = Y.Wegas.TabView.getTab( host.get("label"), this.get("tabSelector"));
                if (!tab) {
                    tab = Y.Wegas.TabView.createTab( host.get("label"), this.get("tabSelector"));

                    Y.Wegas.Widget.use(this.get("subpage"),  Y.bind(function (tab) {// Load the subpage dependencies
                        tab.add(this.get("subpage"));                           // Render the subpage
                    }, this, tab));
                }
                tab.get("parent").selectChild(tab.get("index"));
            }, this);
        }
    }, {
        ATTRS: {
            tabSelector: {
                value: '#centerTabView'
            },
            subpage: {}
        }
    });

    Y.namespace("Plugin").OpenTabAction = OpenTabAction;
});


