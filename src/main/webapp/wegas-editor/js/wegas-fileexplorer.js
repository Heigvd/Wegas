YUI.add('wegas-fileexplorer', function (Y) {
    'use strict';

    var FileExplorer, WegasMenu,
    getClassName = Y.ClassNameManager.getClassName,
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

    FileExplorer = Y.Base.create("wegas-fileexplorer", Y.Widget, [Y.WidgetParent, Y.Wegas.Widget], {

        // ** Private fields ** //
        treeView: null,
        rootNode: null,
        itemClickHandler: null,
        neEvent:null,
        tlClickEvent: null,
        dirCreateEvent: null,
        rootPath:"/",
        uploader:null,
        fakeFile:null,
        directoryMimeType:"application/wfs-directory",
        gameModelId: null,

        // *** Lifecycle methods ** //
        initializer: function() {
            this.gameModelId = Y.Wegas.app.get("currentGameModel");
            this.uploader = new Y.UploaderHTML5();
            this.fakeFile = new Y.FileHTML5({});
        },
        renderUI: function () {
            var cb = this.get(CONTENTBOX);

            Y.log('renderUI()', 'log', "Wegas.FileExplorer");
            this.treeView = new Y.TreeView({
                type: "treeview",
                srcNode: cb
            });
            this.rootNode = new Y.TreeNode({
                type: "treenode",
                collapsed: false,
                label: "/",
                rightWidget: new Y.Wegas.WegasMenu({
                    items: [{
                        label:"add dir",
                        imgSrc:""
                    }],
                    horizontal: true,
                    params:{
                        path: ""
                    }
                })
            });
            this.treeView.add(this.rootNode);
            this.rootNode.path = this.rootPath;
            this.add(this.uploader);
            this.uploader.get(BOUNDING_BOX).hide();
            this.treeView.render();
        },

        bindUI: function () {
            this.listNodeData(this.rootNode);                                   // Load root node content
            this.neEvent = this.treeView.on("*:nodeExpanded", function(e){
                this.listNodeData(e.node);
            }, this);
            this.tlClickEvent = this.treeView.on("treeleaf:click", function(e){
                //TODO: need url path
                window.open("/Wegas/rest/File/GameModelId/" + this.gameModelId + "/read" +e.target.path, null, null);
            }, this);
            this.itemClickHandler = Y.on("wegas-menu:itemClick", function(e){
                this.processMenuClick(e.item, e.params);
            }, this);
            this.dirCreateEvent = this.fakeFile.after("uploadcomplete", function(e){
                console.log("Directory uploaded :", JSON.parse(e.data));
            });
        },
        destructor: function () {
            this.itemClickHandler.detach();
            this.tlClickEvent.detach();
            this.neEvent.detach();
            this.dirCreateEvent.detach();
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
                    success: Y.bind(this.onListRequestSuccess, this),
                    failure: this.onRequestFailure
                }
            });
        },

        processMenuClick: function (action, params) {
            var path, method, name;
            switch(action){
                case 'add file':
                    break;
                case 'add dir':
                    name = prompt("Directory name:");
                    path = Y.Wegas.app.get("dataSources").File.source + "upload" + params.path;
                    method = "POST";
                    if(name === null || name === ""){
                        console.log("Well ... no name");
                    } else {
                        this.uploader.upload(this.fakeFile, path, {name: name});
                    }
                    break;
                case 'delete':
                    path = "delete" + params.path;
                    method = "DELETE";
                    if(confirm("Delete : " + params.path + " ?")){
                        Y.Wegas.app.dataSources.File.sendRequest({
                            request: path,
                            cfg: {
                                headers: DEFAULTHEADERS,
                                method: method,
                                node: params.path
                            },
                            on: {
                                failure: this.onRequestFailure
                            }
                        });
                    }
                    break;
                default:
                    console.log("Not implemented yet :", action);
            }

        },

        onListRequestSuccess: function (e) {
            var i, el, childNode;
            e.cfg.node.destroyChildren();
            for (i = 0; i < e.response.results.length; i += 1) {

                el = e.response.results[i];
                if(el.mimeType === this.directoryMimeType){
                    childNode = new Y.TreeNode({
                        label: el.name,
                        rightWidget: new Y.Wegas.WegasMenu({
                            items: [{
                                label:"add dir",
                                imgSrc:""
                            },{
                                label:"delete",
                                imgSrc:""
                            }],
                            horizontal: true,
                            params:{
                                path: el.path + (el.path.match(".*/$") ? "" : "/") + el.name
                            }
                        })
                    });
                } else {
                    childNode = new Y.TreeLeaf({
                        label: el.name + " [" + el.mimeType + "]",
                        rightWidget: new Y.Wegas.WegasMenu({
                            items: [{
                                label:"delete",
                                imgSrc:""
                            }],
                            horizontal: true,
                            params:{
                                path: el.path + (el.path.match(".*/$") ? "" : "/") + el.name
                            }
                        })
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

    WegasMenu = Y.Base.create("wegas-menu", Y.Widget, [], {
        BOUNDING_TEMPLATE: "<div></div>",
        CONTENT_TEMPLATE:"<ul></ul>",
        nodeInstances: null,
        eventInstances: null,
        clickHandler: null,

        initializer: function () {
            this.nodeInstances = [];
            this.eventInstances = [];
            this.publish("itemClick", {
                broadcast: true,
                emitFacade: true,
                bubbles: true
            });
        },
        renderUI: function () {
            var listItem, item;
            for (var i in this.get("items")){
                item = this.get("items")[i];
                listItem = this.itemCreator(item);
                this.get(CONTENTBOX).append(listItem);
                this.nodeInstances.push(listItem);
            }
        },
        bindUI: function () {
            this.clickHandler = Y.delegate('click', function(e) {					// Listen for click events on the table
                e.stopImmediatePropagation();
                this.fire("itemClick", {
                    item:  e.currentTarget.nodeName,
                    params: this.get('params')
                });
            }, this.get(CONTENTBOX), 'li', this);
        },

        destructor: function () {
            this.clickHandler.detach();
            for(var n in this.nodeInstances){
                this.nodeInstances[n].destroy();
            }
        },
        itemCreator: function (item) {
            var node;
            if(item.imgSrc){
                node = Y.Node.create("<li><img src='" + item.imgSrc + "' alt='" + item.label + "'/></li>");
            } else {
                node = Y.Node.create("<li>" + item.label + "</li>");
            }
            node.nodeName = item.label
            node.addClass(this.getClassName("itemlist", this.get("horizontal") ? "horizontal" : "vertical"));
            return node
        }
    },{
        NAME:"wegas-menu",
        ATTRS:{
            horizontal: {
                value: false,
                validator: Y.Lang.isBoolean
            },
            items:{
                validator: function(o){
                    var valid = Y.Lang.isArray(o) || o === null;
                    for(var i in o){
                        valid = Y.Lang.isString(o[i].label) && (Y.Lang.isString(o[i].imgSrc) || o[i].imgSrc == null)
                    }
                    return valid;
                }
            },
            title: {
                value: null,
                validator: Y.Lang.isString
            },
            params:{                                                            // Given input params returned with the click event, a reference for instance
                value: null
            }
        }
    });

    Y.namespace('Wegas').FileExplorer = FileExplorer;
    Y.namespace('Wegas').WegasMenu = WegasMenu;
});