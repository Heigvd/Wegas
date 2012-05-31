YUI.add('wegas-fileexplorer', function (Y) {
    'use strict';

    var FileExplorer,
    CONTENTBOX = 'contentBox',
    DEFAULTHEADERS = {
        'Content-Type': 'application/json; charset=utf-8'
    },
    ATTRS = {
        path: {
            value: "/",
            setter: function(val){
                return "^/.*".test(val) ? val : "/" + val;
            }
        }
    };

    FileExplorer = Y.Base.create("wegas-fileexplorer", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // ** Private fields ** //
        treeView: null,
        rootPath:"/",
        directoryMimeType:"application/wfs-directory",
        gameModelId: null,

        // *** Lifecycle methods ** //
        initializer: function() {
            Y.TreeView.prototype.destroyAll = function() {
                while (this.size() > 0) {
                        this.item(0).destroy();
                }
            }
            this.gameModelId = Y.Wegas.app.get("currentGameModel");
        },
        renderUI: function () {
            var cb = this.get(CONTENTBOX),
                contentNode = cb.append("<ul></ul>");

            Y.log('renderUI()', 'log', "Wegas.FileExplorer");
            this.treeView = new Y.TreeView({
                type: "TreeView",
                srcNode: contentNode
            });
            this.treeView.path = this.rootPath;
            this.treeView.on("toggleTreeState", function(e){
                var target = Y.Widget.getByNode(e.actionNode);
                this.listNodeData(target);
            }, this);
            this.treeView.on("treeleaf:click", function(e){
                //TODO: need url path
               window.open("/Wegas/rest/File/GameModelId/" + this.gameModelId + "/read" +e.target.path, null, null);
            }, this);
            this.treeView.render();
        },

        bindUI: function () {
            this.listNodeData(this.treeView);                         // Load root node content
        },


        // *** Private methods *** //
        listNodeData: function (node) {

            Y.Wegas.app.dataSources.File.sendRequest({
                request: "list" + node.path,
                cfg: {
                    headers: DEFAULTHEADERS,
                    node: node
                },
                on: {
                    success: Y.bind(this.onRequestSuccess, this),
                    failure: this.onRequestFailure
                }
            });
        },

        onRequestSuccess: function (e) {
            var i, el, childNode;
            e.cfg.node.destroyAll();
            for (i = 0; i < e.response.results.length; i += 1) {
                el = e.response.results[i];
                if(el.mimeType === this.directoryMimeType){
                    childNode = new Y.TreeView({
                        label: el.name
                    });
                } else {
                    childNode = new Y.TreeLeaf({
                        label: el.name + " [" + el.mimeType + "]"
                    });
                }

                childNode.path = el.path + (el.path.match(".*/$") ? "" : "/") + el.name;
                e.cfg.node.add(childNode);
            }
        },

        onRequestFailure: function (e) {
            Y.log("onDataSourceError(): Error retrieving data" + (e.stack || e), "error", "Wegas.FileExplorer");
        }

    }, ATTRS);

    Y.namespace('Wegas').FileExplorer = FileExplorer;
    //FIXME : load TreeView, remove this from initializer
//    Y.TreeView.prototype.destroyAll = function() {
//        while (this.size() > 0) {
//                this.item(0).destroy();
//        }
//    }
});