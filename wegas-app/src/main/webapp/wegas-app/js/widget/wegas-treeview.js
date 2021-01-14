/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
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
    var TreeViewWidget = Y.Base.create("wegas-treeview", Y.TreeView, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        bindUI: function() {
            TreeViewWidget.superclass.bindUI.call(this);
            this.on("treenode:click", function(e) {
                e.target.toggleTree();
            });
        }
    });
    Y.Wegas.TreeViewWidget = TreeViewWidget;
});
