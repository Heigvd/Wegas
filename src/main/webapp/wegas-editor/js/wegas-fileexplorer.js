YUI.add('wegas-fileexplorer', function (Y) {
    'use strict';

    var FileExplorer, ProgressBar,
    getClassName = Y.ClassNameManager.getClassName,
    CONTENTBOX = 'contentBox',
    DEFAULTHEADERS = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    //TODO: notes, preview!

    FileExplorer = Y.Base.create("wegas-fileexplorer", Y.Widget, [Y.WidgetParent, Y.Wegas.Widget, Y.WidgetChild], {

        // ** Private fields ** //
        treeView: null,
        rootNode: null,
        events: null,
        rootPath:"/",
        uploader:null,
        fileUploader:null,
        fakeFile:null,
        editNode: null,
        directoryMimeType:"application/wfs-directory",
        gameModelId: null,

        // *** Lifecycle methods ** //
        initializer: function() {
            this.gameModelId = Y.Wegas.app.get("currentGameModel");
            this.rootPath = "/";
            this.events = {};
            this.uploader = new Y.UploaderHTML5({
                width: "100px",
                fileFieldName: "file",
                selectButtonLabel: "Select File"
            });
            this.uploader.currentNode = null;
            this.fakeFile = new Y.FileHTML5({});
            this.publish("fileSelected", {
                bubbles: true,
                emitFacade: true,
                defaultFn: this.openFile
            });
            this.fileUploader = new this.FileUploader({
                visible:true,
                fileexplorer:this
            });
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
                        label:"refresh",
                        data:"refresh"
                    },{
                        label:"add",
                        cssClass:"",
                        items:[{
                            label:"add dir",
                            data:"add dir"
                        },{
                            label:"add file",
                            data:"add file"
                        }]
                    }],
                    horizontal: true,
                    eventTarget: this,
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
            this.fileUploader.render(this.get(CONTENT_BOX));
            this.fileUploader.hide();
        },

        bindUI: function () {
            this.listNodeData(this.rootNode);                                   // Load root node content
            this.events.neEvent = this.treeView.on("*:nodeExpanded", function(e){
                this.listNodeData(e.node);
            }, this);
            this.events.tlClickEvent = this.treeView.on("treeleaf:iconClick", function(e){
                if(e.target.path){
                    this.fire("fileSelected", Y.Wegas.app.get("base") + "rest/File/GameModelId/" + this.gameModelId + "/read" +e.target.path);
                }
            }, this);
            this.events.tlLClickEvent = this.treeView.on("treeleaf:labelClick", function(e){
                if(e.target.path){
                    this.fire("fileSelected", Y.Wegas.app.get("base") + "rest/File/GameModelId/" + this.gameModelId + "/read" +e.target.path);
                }
            }, this);
            this.events.itemClickHandler = this.treeView.on("wegas-menu:itemClick", function(e){
                this.processMenuClick(e.data, e.target.get("parent"), e.params);
            },this);
            this.events.dirCreateEvent = this.fakeFile.after("uploadcomplete", function(e){
                this.pathToNode(this.rootNode, JSON.parse(e.data).path).expand();
                console.log("Directory uploaded :", JSON.parse(e.data));
            }, this);
            this.uploader.on("fileselect", function(e){
                this.uploader.parentNode.set("rightWidget", new Y.Wegas.WegasMenu({
                    items: [{
                        label:"upload",
                        cssClass:"",
                        data:"upload"
                    },
                    {
                        label: "cancel",
                        cssClass: "",
                        data:"cancel"
                    }],
                    horizontal: true,
                    params:{
                        file:e.fileList[0]
                    }
                }));
                if(this.uploader.parentNode.get("label") == "Filename"){
                    this.uploader.parentNode.set("label", e.fileList[0].get("name"));
                }
                this.uploader._fileInputField.getDOMNode().value = ""           //removing previous selection
            }, this);
            this.fileUploader.on("fileuploadcomplete", function(e){
                console.log(e);
                e.file.treeLeaf.set("loading", false);
                e.file.treeLeaf.get("parent").add(this.createNode(e.data));
                e.file.treeLeaf.destroy();
            }, this);
        },
        destructor: function () {
            for(var i in events){
                events[i].detach();
            }
            this.fakeFile.destroy();
            this.uploader.destroy();
        },

        // *** Private methods *** //
        listNodeData: function (node, callback) {
            if(this.isProcessing(node)){
                console.log("Node already processing ...");
            }else{
                node.set("loading", true);
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
            }
        },

        processMenuClick: function (action, node, params) {
            var path, method, name, file;
            switch(action){
                case 'cancel':
                    node.destroy();
                    break;
                case 'upload':
                    if(node.get("label").length < 4 || node.get("label").indexOf("<") > -1 || node.get("label").indexOf(">") > -1){
                        console.error("Filename length > 3, \"<>\" forbidden");
                        break;
                    }
                    node.set("editable", false);
                    file = params.file;
                    file.treeLeaf = node;
                    this.uploader.set("fileList", []);
                    this.uploader.disable();
                    this.uploader.hide();
                    this.fileUploader.addFile(file)
                    break;

                    break;
                case 'add file':
                    this.addFile(node, true);
                    break;
                case 'refresh':
                    this.refresh(node);
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
                    if ( this.isProcessing(node) ) {
                        console.log("Current node processing, please wait ...");
                    } else {
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
                    }
                    break;
                default:
                    console.log("Not implemented yet :", action);
            }

        },

        onListRequestSuccess: function (callback, e) {
            var i;
            if(this.editNode){
                this.editNode.set("rightWidget", null);
            }
            e.cfg.node.destroyChildren();
            for (i = 0; i < e.response.results.length; i += 1) {
                e.cfg.node.add(this.createNode(e.response.results[i]));
            }
            e.cfg.node.set("loading", false);
            if(callback){
                Y.bind(callback, this)(e);
            }
        },

        createNode: function (data){
            var childNode, conf;
            if(Y.Lang.isString(data)){
                data = JSON.parse(data);
            }
            if(data.mimeType === this.directoryMimeType){
                childNode = new Y.TreeNode({
                    label: data.name,
                    rightWidget: new Y.Wegas.WegasMenu({
                        items: [{
                            label:"refresh",
                            data:"refresh"
                        },{
                            label:"add",
                            cssClass:"",
                            items:[{
                                label:"add dir",
                                data:"add dir"
                            },{
                                label:"add file",
                                data:"add file"
                            }]
                        },{
                            label:"delete",
                            cssClass:"",
                            data:"delete"
                        }],
                        horizontal: true,
                        params:{
                            path: data.path + (data.path.match(".*/$") ? "" : "/") + data.name
                        }
                    })
                });
            } else {
                conf = {
                    label: data.name + " [" + data.mimeType + "]",
                    rightWidget: new Y.Wegas.WegasMenu({
                        items: [{
                            label:"delete",
                            cssClass:"",
                            data:"delete"
                        }],
                        horizontal: true,
                        params:{
                            path: data.path + (data.path.match(".*/$") ? "" : "/") + data.name
                        }
                    })
                };
                if(data.mimeType.indexOf("image") > -1){
                    conf.iconCSS = "image-icon";
                    conf.label = data.name;
                }
                childNode = new Y.TreeLeaf(conf);
            }

            childNode.path = data.path + (data.path.match(".*/$") ? "" : "/") + data.name;
            return childNode;
        },

        removeNode: function (event) {
            event.cfg.node.destroy();
        },
        refresh: function (node) {
            node.expand();
        },

        addFile: function (event, refresh) {
            var name, node;
            if(event instanceof Y.TreeNode){
                node = event;
            }else{
                node = event.cfg.node;
            }
            if(refresh){
                if(this.editNode && this.editNode.get("rightWidget") instanceof Y.UploaderHTML5){
                    this.editNode.set("rightWidget", null);
                    this.editNode.destroy();
                    this.editNode = null;
                }
                if(this.isProcessing(node)){
                    this.addFile(node)
                }
                this.listNodeData(node, this.addFile);
            }else{
                name = "Filename";

                this.editNode = new Y.TreeLeaf({
                    label: name,
                    editable: true,
                    loading: false,
                    rightWidget: this.uploader
                });
                this.uploader.parentNode = this.editNode;
                this.editNode.parentPath = node.path;
                node.add(this.editNode);
                node.expand(false);
                this.uploader.show();
                this.uploader.enable();
            }
            return true;
        },

        openFile: function (e, path){
            window.open(path);
        },

        isProcessing: function(node, index){
            return node.get("loading") || (node instanceof Y.TreeNode ? node._items.some(this.isProcessing, this) : false);
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
            e.cfg.node.set("loading", false);
        },

        FileUploader : Y.Base.create("wegas-fileuploader", Y.Widget, [Y.WidgetParent], {

            overallProgress:null,
            uploader: null,
            events: {},
            fileList: [],

            initializer: function () {
                this.overallProgress = new Y.Wegas.ProgressBar({
                    color:"lightgrey",
                    width: "100px",
                    height: "10px",
                    percent: 100,
                    label:"Total Upload",
                    showValue:true
                });
                this.uploader = new Y.UploaderHTML5({
                    fileFieldName: "file",
                    selectButtonLabel: "Select File",
                    multipleFiles: true
                });
                this.publish("fileuploadcomplete");
            },
            renderUI: function (){
                try{
                    this.get("fileexplorer").get("parent").addToolbarWidget(this.overallProgress);
                    this._set(CONTENT_BOX, this.get("fileexplorer").get("parent").get("toolbarPanel").getDOMNode());
                }catch(e){                                                      //FALLBACK, no toolbar
                    this.get(BOUNDING_BOX).insertBefore("<span>Uploader</span>", this.get(CONTENT_BOX));
                    this.overallProgress.render();
                    this.get(BOUNDING_BOX).insertBefore(this.overallProgress.get(BOUNDING_BOX), this.get(CONTENT_BOX));
                }
                this.overallProgress.hide();
            },
            bindUI: function () {
                this.events.totalProgress = this.uploader.on("totaluploadprogress", function(e){
                    this.overallProgress.set("percent", e.percentLoaded);
                }, this);
                this.events.progress = this.uploader.on("uploadprogress", function(e){               //Not working, traking files individually
                    e.file.progressBar.set("percent", e.percentLoaded);
                    if(e.file.treeLeaf){
                        e.file.treeLeaf.get("rightWidget").set("percent",e.percentLoaded);
                    }
                });
                this.events.complete = this.uploader.on("uploadcomplete", function(e){
                    this.fire("fileuploadcomplete", e);
                }, this);
            },
            syncUI: function () {
            },
            destructor: function () {
                for (var i in events){
                    events[i].detach();
                }
                this.uploader.destroy();
            },

            addFile: function (file) {
                var uploadDescriptor = new Y.Node.create("<div/>"),
                progressDiv = new Y.Node.create("<div/>"), detailDiv = new Y.Node.create("<div/>");
                file.treeLeaf.set("rightWidget", new Y.Wegas.ProgressBar({
                    percent:0,
                    width: "100px",
                    height: "6px",
                    showValue: true,
                    color: "lightgrey"
                }));

                progressDiv.setContent(file.treeLeaf.get("label"));
                detailDiv.setContent("Filename: " + file.get("name") + "<br/>Upload to: " + file.treeLeaf.parentPath + "<br/>Type: " + file.get("type"));
                uploadDescriptor.addClass(this.getClassName("descriptor"))
                progressDiv.addClass(this.getClassName("progress"));
                detailDiv.addClass(this.getClassName("detail"));
                file.progressBar = new Y.Wegas.ProgressBar({
                    percent:0,
                    width: "99%",
                    height: "4px",
                    color:"lightgrey"
                });
                file.progressBar.render(progressDiv);
                uploadDescriptor.append(progressDiv);
                uploadDescriptor.append(detailDiv);
                this.get(CONTENT_BOX).append(uploadDescriptor);
                this.fileList.push(file);
                this.upload(file);
                this.uploader.set("fileList", this.fileList);
            },

            upload: function (file){
                this.overallProgress.show();
                file.treeLeaf.set("loading", true);
                this.uploader.uploadThese([file],
                    Y.Wegas.app.get("dataSources").File.source + "upload" + file.treeLeaf.parentPath,
                    {
                        name:file.treeLeaf.get("label")
                    });

            }
        }, {
            NAME:"FileUploader",
            CSS_PREFIX:"fupload",
            ATTRS:{
                fileexplorer:{
                    value:null,
                    writeOnce:"initOnly"
                }

            }
        })

    },{
        ATTRS:{
            path: {
                value: "/",
                setter: function(val){
                    return "^/.*".test(val) ? val : "/" + val;
                }

            }
        }
    });






    Y.namespace('Wegas').FileExplorer = FileExplorer;

});
