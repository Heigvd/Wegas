/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-inputex-pageloaderselect", function(Y) {
    "use strict";
    var PREVIEW_PAGELOADER_ID = "previewPageLoader", ENTIRE_PAGE_LABEL = "Entire Page";

    Y.namespace("inputEx.Wegas").PageloaderSelect = function(options) {
        Y.inputEx.Wegas.PageloaderSelect.superclass.constructor.call(this, options);
    };
    Y.extend(Y.inputEx.Wegas.PageloaderSelect, Y.inputEx.Wegas.Combobox, {
        setOptions: function(options) {
            var list, root = Y.Wegas.PageLoader.pageLoaderInstances[PREVIEW_PAGELOADER_ID];
            Y.inputEx.Wegas.PageloaderSelect.superclass.setOptions.call(this, options);
            list = root ?
                root.get("contentBox").all(".wegas-pageloader") :
                new Y.ArrayList();
            this.options.autoComp.source.push({value: root.get("pageLoaderId"), label: ENTIRE_PAGE_LABEL});
            list.each(function(item) {
                var w = Y.Widget.getByNode(item);
                if (root.get("widget") === w.get("root")) { //only pageloader on currently edited page. Not those on subpages.
                    this.options.autoComp.source.push(w.get("pageLoaderId"));
                }

            }, this);
            this._buildSource();
        }
    });

    Y.inputEx.registerType("pageloaderselect", Y.inputEx.Wegas.PageloaderSelect);
});