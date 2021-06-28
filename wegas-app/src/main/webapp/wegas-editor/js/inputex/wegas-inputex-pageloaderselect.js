/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-inputex-pageloaderselect", function(Y) {
    "use strict";
    var PREVIEW_PAGELOADER_ID = "previewPageLoader";

    Y.namespace("inputEx.Wegas").PageloaderSelect = function(options) {
        Y.inputEx.Wegas.PageloaderSelect.superclass.constructor.call(this, options);
    };
    Y.extend(Y.inputEx.Wegas.PageloaderSelect, Y.inputEx.Wegas.Combobox, {
        setOptions: function(options) {
            var list,
                root = Y.Wegas.PageLoader.find(PREVIEW_PAGELOADER_ID);
            Y.inputEx.Wegas.PageloaderSelect.superclass.setOptions.call(this, options);
            if (Y.Lang.isArray(options.choices)) {
                this.options.autoComp.source = this.options.autoComp.source.concat(options.choices);
            }
            list = root ?
                root.get("contentBox").all(".wegas-pageloader") :
                new Y.ArrayList();
            list.each(function(item) {
                var w = Y.Widget.getByNode(item),
                    name;
                if (root.get("widget") === w.get("root")) { //only pageloader on currently edited page. Not those on subpages.
                    name = w.get("pageLoaderId");
                    this.options.autoComp.source.push({
                        label: name,
                        value: name,
                        display: "Page display: " + name
                    });
                }

            }, this);
            this._buildSource();
            this.options.autoComp.source = Y.Array.unique(this.options.autoComp.source, function(a, b) {
                return a.label === b.label;
            });
        }
    });

    Y.inputEx.registerType("pageloaderselect", Y.inputEx.Wegas.PageloaderSelect);
});
