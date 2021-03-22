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
YUI.add("wegas-panel-fileselect", function(Y) {
    "use strict";

    Y.Wegas.FileSelect = Y.Base.create("wegas-panel-fileselect", Y.Base, [], {
        initializer: function() {
            this.publish("fileSelected");
            this.publish("directorySelected");
            this.panel = new Y.Panel({
                headerContent: this.get("title"),
                bodyContent: '',
                width: 600,
                height: Y.DOM.winHeight() - 150,
                zIndex: 99999,
                modal: true,
                render: true,
                centered: true
            });
            this.explorer = new Y.Wegas.FileExplorer().render(this.panel.getStdModNode(Y.WidgetStdMod.BODY));
            this.explorer.treeView.filter.set("testFn", this.get("filter"));
            this.panel.get("boundingBox").addClass("wegas-panel-fileselect");
            this.explorer.plug(Y.Plugin.PopupListener);
            this.bind();
        },
        bind: function() {
            this.explorer.on("*:fileSelected", function(e, path) {
                e.halt(true);
                this.fire("fileSelected", path);
            }, this);
            this.explorer.on("*:directorySelected", function(e, path) {
                e.halt(true);
                this.fire("directorySelected", path);
            }, this);
            this.panel.after("visibleChange", function() {
                this.destroy();
            }, this);
        },
        destructor: function() {
            this.explorer.destroy();
            this.panel.destroy();
        }
    }, {
        ATTRS: {
            title: {
                value: 'Choose a file from library'
            },
            filter: {
                validator: Y.Lang.isFunction
            }
        }
    });
});
