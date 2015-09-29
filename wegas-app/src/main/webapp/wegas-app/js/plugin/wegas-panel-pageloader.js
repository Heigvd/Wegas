/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/*global YUI*/
YUI.add("wegas-panel-pageloader", function(Y) {
    "use strict";
    /**
     * Open a panel with a page in it.
     * @type {OpenPanelPageloader}
     */
    Y.Plugin.OpenPanelPageloader = Y.Base.create("wegas-panel-pageloader",
        Y.Plugin.Action, [],
        {
            execute: function() {
                new Y.Wegas.Panel({
                    children: [new Y.Wegas.PageLoader({
                        pageId: this.get("page")
                    })],
                    width: this.get("width"),
                    height: this.get("height"),
                    modal: this.get("modal"),
                }).render();
            }
        },
        {
            NS: "wegaspanelpageloader",
            ATTRS: {
                page: {
                    type: "string",
                    _inputex: {
                        label: "Popup page",
                        _type: "pageselect",
                        required: false
                    }
                },
                width: {
                    value: "80%",
                    type: "string"
                },
                height: {
                    value: "80%",
                    type: "string"
                },
                modal: {
                    value: true,
                    type: "boolean"
                }
            }
        });
});
