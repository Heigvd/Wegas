/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-treeview", function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.TreeView
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class
     * @constructor
     * @description Displays a treeview widget
     */
    var TreeViewWidget = Y.Base.create("wegas-treeview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        renderUI: function() {
            this.treeView = new Y.TreeView({
                render: this.get("contentBox")
            });
            this.treeView.on("treenode:click", function(e) {
                e.target.toggleTree();
            });
            this.treeView.addTarget(this);
        }
    });
    Y.namespace("Wegas").TreeViewWidget = TreeViewWidget;
});
