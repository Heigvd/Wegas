/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-fileexplorer', function (Y) {
    'use strict';

    var FileExplorer,
        CONTENTBOX = 'contentBox',
        YAHOO = Y.YUI2,
        DEFAULTHEADERS = {
            'Content-Type': 'application/json; charset=utf-8'
        };

    FileExplorer = Y.Base.create("wegas-fileexplorer", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // ** Private fields ** //
        treeView: null,

        // *** Lifecycle methods ** //
        renderUI: function () {
            var cb = this.get(CONTENTBOX),
            treeNode = cb.append('<div class="' + this.getClassName('tree') + '"></div>'),
            viewNode = cb.append('<div class="' + this.getClassName('content') + '"></div>');

            Y.log('renderUI()', 'log', "Wegas.FileExplorer");

            this.treeView = new YAHOO.widget.TreeView(treeNode.getDOMNode());   // Render YUI2 TreeView widget
            this.treeView.setDynamicLoad(Y.bind(this.loadNodeData, this));
            this.treeView.singleNodeHighlight = true;
            this.treeView.render();
        },

        bindUI: function () {
            this.loadNodeData(this.treeView.getRoot());                         // Load root node content
        },


        // *** Private methods *** //
        loadNodeData: function (node, onLoadComplete) {

            // @reuben Here we should build the request based on the node data,
            // which will be empty for root node, but will contain stuff later on
            // console.log(node.data);

            Y.Wegas.app.dataSources.File.sendRequest({
                request: "",
                cfg: {
                    headers: DEFAULTHEADERS,
                    node: node,
                    onLoadComplete: onLoadComplete
                },
                callback: {
                    scope: this,
                    success: this.onRequestSuccess,
                    failure: this.onRequestFailure
                }
            });
        },

        onRequestSuccess: function (e) {
            var i, el;

            for (i = 0; i < e.response.results.length; i += 1) {
                el = e.response.results[i];

                new YAHOO.widget.TextNode({                                     // Appends a treeleaf to the target node
                    type: 'Text',
                    label: el.name,
                    title: el.name,
                    isLeaf: el.type === "file",
                    data: el
                }, e.cfg.node);
            }

            if (e.cfg.onLoadComplete) {
                e.cfg.onLoadComplete();
            } else {
                e.cfg.node.tree.render();
            }
        },

        onRequestFailure: function (e) {
            Y.log("onDataSourceError(): Error retrieving data" + (e.stack || e), "error", "Wegas.FileExplorer");

            if (e.cfg.onLoadComplete) {
                e.cfg.onLoadComplete();
            }
        }

    }, {
        ATTRS : {}
    });

    Y.namespace('Wegas').FileExplorer = FileExplorer;
});