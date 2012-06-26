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

    //TODO: multiple files upload, correct bugs, no popup inputs. notes!

    FileExplorer = Y.Base.create("wegas-fileexplorer", Y.Widget, [Y.WidgetParent, Y.Wegas.Widget], {

        // ** Private fields ** //
        treeView: null,
        rootNode: null,
        events: {},
        rootPath:"/",
        uploader:null,
        fakeFile:null,
        editingFile: null,
        directoryMimeType:"application/wfs-directory",
        gameModelId: null,

        // *** Lifecycle methods ** //
        initializer: function() {
            this.gameModelId = Y.Wegas.app.get("currentGameModel");
            this.rootPath = "/";
            this.uploader = new Y.UploaderHTML5({
                width: "100px",
                fileFieldName: "file"
            });
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
                    },{
                        label:"add file",
                        imgSrc:""
                    } ],
                    horizontal: true,
                    params:{
                        path: ""
                    }
                })
            });
            this.treeView.add(this.rootNode);
            this.rootNode.path = this.rootPath;
            this.add(this.uploader);
            this.uploader.hide();
            this.treeView.render();
        },

        bindUI: function () {
            this.listNodeData(this.rootNode);                                   // Load root node content
            this.events.neEvent = this.treeView.on("*:nodeExpanded", function(e){
                this.listNodeData(e.node);
            }, this);
            this.events.tlClickEvent = this.treeView.on("treeleaf:labelClick", function(e){
                //TODO: need url path
                window.open(Y.Wegas.app.get("base") + "rest/File/GameModelId/" + this.gameModelId + "/read" +e.target.path, null, null);
            }, this);
            this.events.itemClickHandler = this.treeView.on("wegas-menu:itemClick", function(e){
                this.processMenuClick(e.item, e.parent);
            },this);
            this.events.dirCreateEvent = this.fakeFile.after("uploadcomplete", function(e){
                this.pathToNode(this.rootNode, JSON.parse(e.data).path).expand();
                console.log("Directory uploaded :", JSON.parse(e.data));
            }, this);
        },
        destructor: function () {
            for(var i in events){
                events[i].detach();
            }
            this.uploader.destroy();
            this.fakeFile.destroy();
        },

        // *** Private methods *** //
        listNodeData: function (node, callback) {

            Y.Wegas.app.dataSources.File.sendRequest({
                request: "list" + node.path,
                cfg: {
                    headers: DEFAULTHEADERS,
                    node: node
                },
                on: {
                    success: Y.bind(this.onListRequestSuccess, this, callback),
                    failure: this.onRequestFailure
                }
            });
        },

        processMenuClick: function (action, node) {
            var path, method, name, files;
            switch(action){
                case 'cancel':
                    this.uploader.hide();
                    this.get(CONTENT_BOX).appendChild(this.uploader);
                    this.editingFile.destroy();
                    this.editingFile = null;
                    break;
                case 'upload':
                    if(this.uploader.get("enabled")){
                        path = Y.Wegas.app.get("dataSources").File.source + "upload" + node.parentPath;
                        files = this.uploader.get("fileList");
                        this.tmpEvent = files[0].on("uploadcomplete", function(e){
                            this.editingFile.get("parent").expand();
                            this.uploader.set("fileList", []);
                            this.uploader.enable();
                            this.tmpEvent.detach();
                        }, this);
                        this.uploader.upload(files[0], path, {
                            name: this.editingFile.get("label")
                        });
                        this.uploader.disable();
                        this.uploader.hide();
                        this.get(CONTENT_BOX).appendChild(this.uploader);
                    }else{
                        console.log("upload in progress, stay tuned for further improvements");
                    }
                    break;
                case 'add file':
                    this.addFile(node, true);
                    break;
                case 'add dir':
                    name = prompt("Directory name:");
                    path = Y.Wegas.app.get("dataSources").File.source + "upload" + node.path;
                    if(name === null || name === ""){
                        console.log("Well ... no name, exiting");
                    } else {
                        this.uploader.upload(this.fakeFile, path, {
                            name: name
                        });
                    }
                    break;
                case 'delete':
                    path = "delete" + node.path;
                    method = "DELETE";
                    if(confirm("Delete : " + node.path + " ?")){
                        Y.Wegas.app.dataSources.File.sendRequest({
                            request: path,
                            cfg: {
                                headers: DEFAULTHEADERS,
                                method: method,
                                node: node
                            },
                            on: {
                                success: this.removeNode,
                                failure: this.onRequestFailure
                            }
                        });

                    }
                    break;
                default:
                    console.log("Not implemented yet :", action);
            }

        },

        onListRequestSuccess: function (callback, e) {
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
                            },
                            {
                                label:"add file",
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
            if(callback){
                Y.bind(callback, this)(e);
            }
        },

        removeNode: function(event){
            event.cfg.node.destroy();
        },

        addFile: function (event, refresh) {
            var name;
            if(refresh){
                if(this.editingFile){
                    this.uploader.hide();
                    this.get(CONTENT_BOX).appendChild(this.uploader);
                    this.editingFile.destroy();
                    this.editingFile = null;
                }
                event.expand(true);
                this.listNodeData(event, this.addFile);
            }else{
                name = prompt("File name ?");
                if(name === "" || name === null){
                    console.log("no name");
                }else{
                    this.editingFile = new Y.TreeLeaf({
                        label: name,
                        rightWidget: new Y.Wegas.WegasMenu({
                            items: [{
                                label:"upload",
                                imgSrc:""
                            },
                            {
                                label: "cancel",
                                imgSrc: ""
                            }],
                            horizontal: true
                        })
                    });
                    event.cfg.node.add(this.editingFile);
                    this.editingFile.parentPath = event.cfg.node.path;
                    this.editingFile.get(CONTENT_BOX).appendChild(this.uploader.get(BOUNDING_BOX));
                    this.uploader.show();
                    this.processUpload();
                }
            }
            return true;
        },

        processUpload: function (file) {

        },

        pathToNode: function (node, path) {
            var n = null;
            if(node.path === path){
                return node;
            }else{
                for (var i in node._items){
                    n = this.pathToNode(node._items[i], path);
                    if(n instanceof Y.TreeNode || n instanceof Y.TreeLeaf){
                        return n;
                    }
                }
            }
            return null;
        },

        onRequestFailure: function (e) {
            Y.log("onDataSourceError(): Error retrieving data" + (e.stack || e), "error", "Wegas.FileExplorer");
        }

    }, ATTRS);

    WegasMenu = Y.Base.create("wegas-menu", Y.Widget, [Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<div></div>",
        CONTENT_TEMPLATE:"<ul></ul>",
        nodeInstances: null,
        eventInstances: null,
        clickHandler: null,

        initializer: function () {
            this.nodeInstances = [];
            this.eventInstances = [];
            this.publish("itemClick", {
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
            this.clickHandler = this.get(CONTENTBOX).delegate('click', function(e) {					// Listen for click events on the table
                e.stopImmediatePropagation();
                this.fire("itemClick", {
                    parent: this.get("parent"),
                    item:  e.currentTarget.nodeName,
                    params: this.get('params')
                });
            }, 'li', this);
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
        CSS_PREFIX: "wegas-menu",
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