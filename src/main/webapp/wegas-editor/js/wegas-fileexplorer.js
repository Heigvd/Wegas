/**
 *
 *  @todo Threat network error (now enlessely loading)
 *  @todo if there is a scrol and we click on new file, widget needs to scroll to that widget
 *  @todo
 */


YUI.add('wegas-fileexplorer', function (Y) {
    'use strict';

    var FileExplorer, ProgressBar,
    getClassName = Y.ClassNameManager.getClassName,
    CONTENTBOX = 'contentBox',
    DEFAULTHEADERS = {
        'Content-Type': 'application/json; charset=ISO-8859-1'
    },
    CONTENT_BOX="contentBox",
    BOUNDING_BOX="boundingBox";

    //TODO: preview!

    FileExplorer = Y.Base.create("wegas-fileexplorer", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild], {

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
            this.events = [];
            this.uploader = new Y.UploaderHTML5({
                width: "100px",
                fileFieldName: "file",
                selectButtonLabel: "Select File",
                appendNewFiles:false
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
                srcNode: cb,
                visibleRightWidget:false
            });
            this.rootNode = new Y.TreeNode({
                collapsed: false,
                label: "/",
                rightWidget: new Y.Wegas.WegasMenu({
                    items: [{
                        label:"",
                        cssClass:"wegas-icon-refresh",
                        tooltip:"Refresh",
                        data:"refresh"
                    },{
                        label:"",
                        cssClass:"wegas-icon-new",
                        tooltip:"Add ...",
                        items:[{
                            label:"",
                            cssClass:"wegas-icon-newdir",
                            tooltip:"Add a directory",
                            data:"add dir"
                        },{
                            label:"",
                            cssClass:"wegas-icon-newfile",
                            tooltip:"Add a file",
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
            this.uploader.render();
            this.uploader.hide();
            this.treeView.render();
            this.fileUploader.render(this.get(CONTENT_BOX));
            this.fileUploader.hide();
        },

        bindUI: function () {
            this.events.push(this.treeView.get(CONTENT_BOX).delegate("drop", function(e){

                var node = Y.Widget.getByNode(e.currentTarget),
                files = e._event.dataTransfer.files, file;
                e.currentTarget.removeClass("fileexplorer-drag-over");
                e.halt(true);
                for(var i=0; i<files.length; i = i+1){
                    if(files[i].type != ""){
                        file = new Y.FileHTML5({
                            file:files[i]
                        });
                        file.treeLeaf = new Y.TreeLeaf({
                            label:file.get("name")
                        });
                        try{
                            node.add(file.treeLeaf);
                        }catch(er){
                        // TODO: find out that after a delete
                        }
                        file.treeLeaf.parentPath = node.path;
                        this.fileUploader.addFile(file);
                    }
                }
            }, '.yui3-treenode', this));
            this.events.push(this.treeView.get(CONTENT_BOX).delegate("dragover", function(e){
                var node = Y.Widget.getByNode(e.currentTarget);
                e.halt(true);
                e.currentTarget.addClass("fileexplorer-drag-over");
                node.expandTimeout = node.expandTimeout? node.expandTimeout : Y.later(300, node, node.expand);

            },'.yui3-treenode'));
            this.events.push(this.treeView.get(CONTENT_BOX).delegate("dragleave", function(e){
                var node = Y.Widget.getByNode(e.currentTarget);
                e.halt(true);
                if(node.expandTimeout){
                    node.expandTimeout.cancel();
                    delete node.expandTimeout;
                }
                e.currentTarget.removeClass("fileexplorer-drag-over");

            },'.yui3-treenode'));
            this.listNodeData(this.rootNode);                                   // Load root node content
            this.treeView.on("*:nodeExpanded", function(e){
                this.listNodeData(e.node);
            }, this);
            this.treeView.on("treeleaf:iconClick", function(e){
                if(e.target.path){
                    this.fire("fileSelected", e.target.path);
                }
            }, this);
            this.events.tlLClickEvent = this.treeView.on("treeleaf:labelClick", function(e){
                if(e.target.path){
                    this.fire("fileSelected", e.target.path);
                }
            }, this);
            this.treeView.on("wegas-menu:itemClick", function(e){
                this.processMenuClick(e.data, e.target.get("parent"), e.params);
            },this);
            this.fakeFile.after("uploadcomplete", function(e){
                this.pathToNode(this.rootNode, JSON.parse(e.data).path).expand();
                console.log("Directory uploaded :", JSON.parse(e.data));
            }, this);
            this.uploader.after("fileselect", function(e){
                this.uploader.parentNode.set("rightWidget", new Y.Wegas.WegasMenu({
                    items: [{
                        label:"Upload",
                        cssClass:"wegas-icon-upload",
                        data:"upload"
                    },
                    {
                        label: "Cancel",
                        cssClass: "wegas-icon-cancel",
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
            }, this);
            this.fileUploader.on("fileuploadcomplete", function(e){
                var node;
                e.file.treeLeaf.set("loading", false);
                node = this.createNode(e.data)
                if(node){
                    e.file.treeLeaf.get("parent").add(node);
                }else{
                    e.file.progressBar.set("color", "red");
                }
                e.file.treeLeaf.destroy();
            }, this);
        },
        destructor: function () {
            for(var i in this.events){
                this.events[i].detach();
            }
            this.treeView.destroy();
            this.fakeFile.destroy();
            this.uploader.destroy();
            this.fileUploader.destroy();
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
            if(!action){
                return;
            }
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
                    this.fileUploader.addFile(file);
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
                case 'edit':
                    file = params.data;
                    Y.Plugin.EditEntityAction.showEditForm(file, Y.bind(this.editContent, this, node));
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
        editContent:function(node, data){
            var  method="PUT";
            Y.Wegas.app.dataSources.File.sendRequest({
                request: node.path.substring(1, node.path.length),              //remove first "/"
                cfg: {
                    headers: DEFAULTHEADERS,
                    method: method,
                    data:Y.JSON.stringify(data),
                    node: node
                },

                on: {
                    success: this.updateContent,
                    failure: this.onRequestFailure
                }
            });
        },
        updateContent:function(e){
            var node = e.cfg.node,
            data = JSON.parse(e.data.response);
            node.get("rightWidget").get("params").data.set("description",  data.description);
            node.get("rightWidget").get("params").data.set("note", data.note);

            EditEntityAction.hideEditFormOverlay();
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
                callback.call(this, e);
            }
        },

        createNode: function (data){
            var childNode, conf;
            if(Y.Lang.isString(data)){
                data = JSON.parse(data);
            }
            if(!data.mimeType){
                return null;
            }
            if(data.mimeType === this.directoryMimeType){
                childNode = new Y.TreeNode({
                    label: data.name,
                    rightWidget: new Y.Wegas.WegasMenu({
                        items: [{
                            label:"",
                            cssClass:"wegas-icon-refresh",
                            tooltip:"Refresh",
                            data:"refresh"
                        },{
                            label:"",
                            cssClass:"wegas-icon-new",
                            tooltip:"Add ...",
                            items:[{
                                label:"",
                                cssClass:"wegas-icon-newdir",
                                tooltip:"Add a directory",
                                data:"add dir"
                            },{
                                label:"",
                                cssClass:"wegas-icon-newfile",
                                tooltip:"Add a file",
                                data:"add file"
                            }]
                        }, {
                            cssClass:"wegas-icon-edit",
                            tooltip:"Edit",
                            data:"edit"
                        },{
                            label:"",
                            cssClass:"wegas-icon-delete",
                            tooltip:"Delete directory",
                            data:"delete"
                        }],
                        horizontal: true,
                        params:{
                            path: data.path + (data.path.match(".*/$") ? "" : "/") + data.name,
                            data : new Y.Wegas.persistence.Directory(data)
                        }
                    })
                });
            } else {
                conf = {
                    label: data.name + " [" + data.mimeType + "]",
                    rightWidget: new Y.Wegas.WegasMenu({
                        items: [{
                            cssClass:"wegas-icon-edit",
                            tooltip:"Edit",
                            data:"edit"
                        },{
                            label:"",
                            cssClass:"wegas-icon-delete",
                            tooltip:"Delete file",
                            data:"delete"
                        }],
                        horizontal: true,
                        params:{
                            path: data.path + (data.path.match(".*/$") ? "" : "/") + data.name,
                            data: new Y.Wegas.persistence.File(data)
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
            //In case rightWidget opacity change.
            this.uploader.get(BOUNDING_BOX).get("parentNode").setStyle("opacity", 1); //force opacity to 1 on rightWidget
            }
            return true;
        },

        openFile: function (e, path){
            window.open(Y.Wegas.app.get("base") + "rest/File/GameModelId/" + this.gameModelId + "/read" + path);
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
            EditEntityAction.hideEditFormOverlay();
        },

        FileUploader : Y.Base.create("wegas-fileuploader", Y.Widget, [Y.WidgetParent], {

            overallProgress:null,
            uploader: null,
            events: {},
            fileList: [],

            initializer: function () {
                this.fileList = [];
                this.totalBytes = 0;
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
                    this.get("fileexplorer").toolbar.add( this.overallProgress );
                    this._set(CONTENT_BOX, this.get("fileexplorer").toolbar.get("panel").getDOMNode());
                }catch(e){                                                      //FALLBACK, no toolbar
                    this.get(BOUNDING_BOX).insertBefore("<span>Uploader</span>", this.get(CONTENT_BOX));
                    this.overallProgress.render();
                    this.get(BOUNDING_BOX).insertBefore(this.overallProgress.get(BOUNDING_BOX), this.get(CONTENT_BOX));
                }
                this.overallProgress.hide();
            },
            bindUI: function () {
                this.events.totalProgress = this.uploader.on("totaluploadprogress", function(e){
                    var uploaded = 0, total=0;
                    for(var f in this.fileList){
                        uploaded += this.fileList[f].get("bytesUploaded");
                        total += this.fileList[f].get("size");
                    }
                    this.overallProgress.set("percent", uploaded/total * 100);
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
                this.totalBytes += file.get("size");
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
