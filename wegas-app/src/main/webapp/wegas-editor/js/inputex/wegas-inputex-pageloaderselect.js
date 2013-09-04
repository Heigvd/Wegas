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

    Y.namespace("inputEx.Wegas").PageloaderSelect = function(options) {
        Y.inputEx.Wegas.PageloaderSelect.superclass.constructor.call(this, options);
    };
    Y.extend(Y.inputEx.Wegas.PageloaderSelect, Y.inputEx.SelectField, {
        setOptions: function(options) {
            var list, root = Y.Wegas.PageLoader.pageLoaderInstances.previewPageLoader;
            Y.inputEx.Wegas.PageloaderSelect.superclass.setOptions.call(this, options);
            list = root ?
                    root.get("contentBox").all(".wegas-pageloader") :
                    new Y.ArrayList();
            list.each(function(item) {
                var w = Y.Widget.getByNode(item);
                if (root.get("widget") === w.get("root")) { //only pageloader on currently edited page. Not those on subpages.
                    this.options.choices.push({value: w.get("pageLoaderId")});
                }

            }, this);

        }
    });

    Y.inputEx.registerType("pageloaderselect", Y.inputEx.Wegas.PageloaderSelect);
});