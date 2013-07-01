/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add('wegas-fileexplorer', function(Y) {
    'use strict';

    var FileExplorer,
            CONTENTBOX = 'contentBox',
            DEFAULTHEADERS = {
        'Content-Type': 'application/json; charset=ISO-8859-1',
        'Managed-Mode': false
    },
    MAX_FILE_SIZE = 20000000, BOUNDING_BOX = "boundingBox";

    FileExplorer = Y.Base.create("wegas-fileexplorer", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild], {
        // ** Private fields ** //
        treeView: null,
        rootNode: null,
        events: null,
        rootPath: "/",
        uploader: null,
        fileUploader: null,
        fakeFile: null,
        editNode: null,
        directoryMimeType: "application/wfs-directory",
        gameModelId: null,
        // *** Lifecycle methods ** //
        initializer: function() {
            this.gameModelId = Y.Wegas.app.get("currentGameModel");
            this.rootPath = "/";
            this.events = [];
            this.search = null;
            this.tooltip = null;
            this.uploader = new Y.UploaderHTML5({
                width: "100px",
                fileFieldName: "file",
                selectButtonLabel: "Select File",
                appendNewFiles: false
            });
            this.uploader.currentNode = null;
            this.fakeFile = new Y.FileHTML5({});
            this.publish("fileSelected", {
                bubbles: true,
                emitFacade: true,
                defaultFn: this.openFile
            });
            this.fileUploader = new this.FileUploader({
                visible: true,
                fileexplorer: this
            });
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);

            Y.log('renderUI()', 'log', "Wegas.FileExplorer");
            if (this.get("filter")) {
                this.treeView = new Y.TreeView({
                    visibleRightWidget: false,
                    plugins: [{
                            fn: Y.Plugin.TreeViewFilter,
                            cfg: {
                                testFn: function(searchVal) {
                                    var ret = (searchVal === "");
                                    if (!ret) {
                                        ret = this.get("label").toLowerCase().indexOf(searchVal.toLowerCase()) > -1;
                                    }
                                    if (!ret && this.get("data") && this.get("data.mimeType")) {
                                        ret = this.get("data.mimeType").toLowerCase().indexOf(searchVal.toLowerCase()) === 0;
                                    }
                                    return ret;
                                },
                                regExp: false
                            }
                        }]
                });
            } else {
                this.treeView = new Y.TreeView({
                    visibleRightWidget: false
                });
            }
            this.rootNode = new Y.TreeNode({
                collapsed: false,
                label: "/",
                rightWidget: new Y.Wegas.WegasMenu({
                    items: [{
                            label: "",
                            cssClass: "wegas-icon wegas-icon-refresh",
                            tooltip: "Refresh",
                            data: "refresh"
                        }, {
                            label: "",
                            cssClass: "wegas-icon wegas-icon-newdir",
                            tooltip: "Add a directory",
                            data: "add dir"
                        }, {
                            label: "",
                            cssClass: "wegas-icon wegas-icon-newfile",
                            tooltip: "Add a file",
                            data: "add file"
                        }],
                    horizontal: true,
                    eventTarget: this,
                    params: {
                        path: ""
                    }
                })
            });
            this.treeView.add(this.rootNode);
            this.rootNode.path = this.rootPath;
            this.uploader.render();
            this.uploader.hide();
            this.treeView.render(cb);
            this.fileUploader.render(this.get(CONTENTBOX));
            this.fileUploader.hide();
            if (this.get("filter")) {
                this.search = Y.Node.create("<input class='treeview-search' type='text' placeholder='Filter'/>");
                if (this.toolbar) {
                    this.toolbar.get("header").append(this.search);
                } else {
                    this.get("boundingBox").append(this.search);
                    this.search.hide();
                    this.search.after("blur", function(e) {
                        if (this.getDOMNode().value === "") {
                            this.hide();
                        }
                    });
                }
            }
            this.get("boundingBox").append("<div class='fileexplorer-footer'>Upload file(s) by dragging & dropping them on a directory</div>");
            this.tooltip = new Y.Wegas.Tooltip({//
                delegate: this.get("contentBox"),
                delegateSelect: ".yui3-treeleaf-content-label",
                render: true,
                autoHideDelay: 20000
            });
        },
        bindUI: function() {
            this.tooltip.on("triggerEnter", function(e) {                  // The tooltip content is set on the fly based on the node
                var leaf = Y.Widget.getByNode(e.node), ret = "";
                if (!leaf.data) {
                    return;
                }
                if (leaf.data.mimeType.indexOf("image") > -1) {
                    ret += '<img src="' + this.getFullPath(leaf.path) + '" /><br />';
                }
                ret += leaf.data.mimeType + "<br />";
                ret += FileExplorer.formatFileSize(leaf.data.bytes) + "<br /";
                this.tooltip.setTriggerContent(ret);
            }, this);
            //Prevent drop to avoid application exit
            this.get(BOUNDING_BOX).on("drop", function(e) {
                e.halt(true);
            });
            this.get(BOUNDING_BOX).on("dragover", function(e) {
                e._event.dataTransfer.dropEffect = 'none';
                e.halt(true);
            });
            this.events.push(this.treeView.get(CONTENTBOX).delegate("drop", function(e) {

                var i, file, node = Y.Widget.getByNode(e.currentTarget),
                        files = e._event.dataTransfer.files;
                e.currentTarget.removeClass("fileexplorer-drag-over");
                e.halt(true);
                for (i = 0; i < files.length; i = i + 1) {
                    if (files[i].type !== "") {
                        file = new Y.FileHTML5({
                            file: files[i]
                        });
                        file.treeLeaf = new Y.TreeLeaf({
                            label: file.get("name")
                        });
                        try {
                            node.add(file.treeLeaf);
                        } catch (er) {
                            // TODO: find out that after a delete
                        }
                        file.treeLeaf.parentPath = node.path;
                        try {
                            this.fileUploader.addFile(file);
                        } catch (e) {
                            this.showMessage("error", e.message);
                            file.treeLeaf.destroy();
                        }
                    }
                }
            }, '.yui3-treenode', this));
            this.events.push(this.treeView.get(CONTENTBOX).delegate("dragover", function(e) {
                var node = Y.Widget.getByNode(e.currentTarget);
                e.halt(true);
                e.currentTarget.addClass("fileexplorer-drag-over");
                node.expandTimeout = node.expandTimeout || Y.later(300, node, node.expand);

            }, '.yui3-treenode'));
            this.events.push(this.treeView.get(CONTENTBOX).delegate("dragleave", function(e) {
                var node = Y.Widget.getByNode(e.currentTarget);
                e.halt(true);
                if (node.expandTimeout) {
                    node.expandTimeout.cancel();
                    delete node.expandTimeout;
                }
                e.currentTarget.removeClass("fileexplorer-drag-over");

            }, '.yui3-treenode'));
            this.listNodeData(this.rootNode);                                   // Load root node content
            this.treeView.on("*:nodeExpanded", function(e) {
                this.listNodeData(e.node);
            }, this);
            this.treeView.on("treeleaf:iconClick", function(e) {
                if (e.target.path) {
                    this.fire("fileSelected", e.target.path);
                }
            }, this);
            this.events.tlLClickEvent = this.treeView.on("treeleaf:labelClick", function(e) {
                if (e.target.path) {
                    this.fire("fileSelected", e.target.path);
                }
            }, this);
            this.treeView.on("wegas-menu:itemClick", function(e) {
                this.processMenuClick(e.data, e.target.get("parent"), e.params);
            }, this);
            this.fakeFile.after("uploadcomplete", function(e) {
                this.pathToNode(this.rootNode, JSON.parse(e.data).path).expand();
                this.showMessage("success", "Directory successfully created");
            }, this);
            this.uploader.after("fileselect", function(e) {
                this.uploader.parentNode.set("rightWidget", new Y.Wegas.WegasMenu({
                    items: [{
                            label: "Upload",
                            cssClass: "wegas-icon wegas-icon-upload",
                            data: "upload"
                        }, {
                            label: "Cancel",
                            cssClass: "wegas-icon wegas-icon-cancel",
                            data: "cancel"
                        }],
                    horizontal: true,
                    params: {
                        file: e.fileList[0]
                    }
                }));
                if (this.uploader.parentNode.get("label") === "Filename") {
                    this.uploader.parentNode.set("label", e.fileList[0].get("name"));
                }
            }, this);
            this.fileUploader.on("fileuploadcomplete", function(e) {
                var node;
                e.file.treeLeaf.set("loading", false);
                node = this.createNode(e.data);
                if (node) {
                    e.file.treeLeaf.get("parent").add(node);
                    this.showMessage("success", JSON.parse(e.data).name + ": upload successfull");
                } else {
                    e.file.progressBar.set("color", "red");
                    this.showMessage("error", JSON.parse(e.data).name + ": upload failed");
                }
                try {
                    e.file.treeLeaf.destroy();
                } catch (ex) {
                }
            }, this);
            this.fileUploader.on("fileuploaderror", function(e) {
                e.file.progressBar.set("color", "red");
                e.file.treeLeaf.set("loading", false);
                this.showMessage("error", e.statusText);
                try {
                    e.file.treeLeaf.destroy();
                } catch (ex) {
                }
            }, this);
            if (this.search) {
                this.before("keydown", function(e) {
                    if (e.domEvent.ctrlKey && String.fromCharCode(e.domEvent.charCode).toUpperCase() === "F") {
                        e.domEvent.preventDefault();
                        this.search.focus();
                        this.search.show();
                    }
                });
                this.search.after("keyup", function(e) {
                    this.treeView.filter.set("searchVal", this.search.getDOMNode().value);
                }, this);
            }
        },
        destructor: function() {
            var i;
            for (i in this.events) {
                this.events[i].detach();
            }
            this.tooltip.destroy();
            this.treeView.destroy();
            this.fakeFile.destroy();
            this.uploader.destroy();
            this.fileUploader.destroy();
        },
        // *** Private methods *** //
        listNodeData: function(node, callback) {
            if (!this.isProcessing(node)) {
                node.set("loading", true);
                Y.Wegas.Facade.File.sendRequest({
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
        processMenuClick: function(action, node, params) {
            var path, method, name, file;
            if (!action) {
                return;
            }
            switch (action) {
                case 'cancel':
                    node.destroy();
                    break;

                case 'upload':
                    file = params.file;
                    file._set("name", node.get("label"));
                    file.treeLeaf = node;
                    this.uploader.set("fileList", []);
                    this.uploader.disable();
                    this.uploader.hide();
                    try {
                        this.fileUploader.addFile(file);
                        node.set("editable", false);
                    } catch (e) {
                        this.showMessage("error", e.message);
                        // file.treeLeaf.destroy();
                    }
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
                    if (name === null || name === "") {
                        this.showMessage("error", "Directory name is required");
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
                    if (!this.isProcessing(node)) {
                        path = "delete" + node.path;
                        method = "DELETE";
                        if (confirm("Delete : " + node.path + " ?")) {
                            Y.Wegas.Facade.File.sendRequest({
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
                    Y.log("Not implemented yet :" + action, "warn", "Y.Wegas.FileExplorer");
            }

        },
        editContent: function(node, data) {
            var method = "PUT";
            Y.Wegas.Facade.File.sendRequest({
                request: node.path.substring(1, node.path.length), //remove first "/"
                cfg: {
                    headers: DEFAULTHEADERS,
                    method: method,
                    data: Y.JSON.stringify(data),
                    node: node
                },
                on: {
                    success: this.updateContent,
                    failure: this.onRequestFailure
                }
            });
        },
        updateContent: function(e) {
            var node = e.cfg.node,
                    data = e.response.results;
            node.get("rightWidget").get("params").data.setAttrs({
                description: data.description,
                note: data.note
            });
            Y.Plugin.EditEntityAction.showFormMessage("success", data.name + " successfully updated.");
            Y.Plugin.EditEntityAction.hideEditFormOverlay();
        },
        onListRequestSuccess: function(callback, e) {
            var i;
            if (this.editNode) {
                this.editNode.set("rightWidget", null);
            }
            e.cfg.node.destroyChildren();
            for (i = 0; i < e.response.results.length; i += 1) {
                e.cfg.node.add(this.createNode(e.response.results[i]));
            }
            e.cfg.node.set("loading", false);
            if (callback) {
                callback.call(this, e);
            }
        },
        createNode: function(data) {
            var childNode, conf;
            if (Y.Lang.isString(data)) {
                data = JSON.parse(data);
            }
            if (!data.mimeType) {
                return null;
            }
            if (data.mimeType === this.directoryMimeType) {
                childNode = new Y.TreeNode({
                    label: data.name,
                    rightWidget: new Y.Wegas.WegasMenu({
                        items: [{
                                label: "",
                                cssClass: "wegas-icon wegas-icon-refresh",
                                tooltip: "Refresh",
                                data: "refresh"
                            }, {
                                label: "",
                                cssClass: "wegas-icon wegas-icon-newdir",
                                tooltip: "Add a directory",
                                data: "add dir"
                            }, {
                                label: "",
                                cssClass: "wegas-icon wegas-icon-newfile",
                                tooltip: "Add a file",
                                data: "add file"
                            }, {
                                cssClass: "wegas-icon wegas-icon-edit",
                                tooltip: "Edit",
                                data: "edit"
                            }, {
                                label: "",
                                cssClass: "wegas-icon wegas-icon-delete",
                                tooltip: "Delete directory",
                                data: "delete"
                            }],
                        horizontal: true,
                        params: {
                            path: data.path + (data.path.match(".*/$") ? "" : "/") + data.name,
                            data: new Y.Wegas.persistence.Directory(data)
                        }
                    }),
                    data: data
                });
            } else {
                conf = {
                    label: data.name /*+ " [" + data.mimeType + "]"*/,
                    rightWidget: new Y.Wegas.WegasMenu({
                        items: [{
                                cssClass: "wegas-icon wegas-icon-edit",
                                tooltip: "Edit",
                                data: "edit"
                            }, {
                                label: "",
                                cssClass: "wegas-icon wegas-icon-delete",
                                tooltip: "Delete file",
                                data: "delete"
                            }],
                        horizontal: true,
                        params: {
                            path: data.path + (data.path.match(".*/$") ? "" : "/") + data.name,
                            data: new Y.Wegas.persistence.File(data)
                        }
                    })
                };

                conf.iconCSS = "wegas-icon-" + data.mimeType.replace("/", '-') + " wegas-icon-file";
                conf.data = data;

                //if(data.mimeType.indexOf("image") > -1){
                // conf.iconCSS += " image-icon";
                //conf.label = data.name;
                //}
                childNode = new Y.TreeLeaf(conf);
                childNode.data = data;
            }

            childNode.path = data.path + (data.path.match(".*/$") ? "" : "/") + data.name;
            return childNode;
        },
        removeNode: function(event) {
            event.cfg.node.destroy();
        },
        refresh: function(node) {
            node.expand();
        },
        addFile: function(event, refresh) {
            var name, node;
            if (event instanceof Y.TreeNode) {
                node = event;
            } else {
                node = event.cfg.node;
            }
            if (refresh) {
                if (this.editNode && this.editNode.get("rightWidget") instanceof Y.UploaderHTML5) {
                    this.editNode.set("rightWidget", null);
                    this.editNode.destroy();
                    this.editNode = null;
                }
                if (this.isProcessing(node)) {
                    this.addFile(node);
                }
                this.listNodeData(node, this.addFile);
            } else {
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
                this.uploader.get(BOUNDING_BOX).scrollIntoView();
                //In case rightWidget opacity change.
                this.uploader.get(BOUNDING_BOX).get("parentNode").setStyle("opacity", 1); //force opacity to 1 on rightWidget
            }
            return true;
        },
        openFile: function(e, path) {
            window.open(this.getFullPath(path));
        },
        getFullPath: function(relativePath) {
            return Y.Wegas.app.get("base") + "rest/File/GameModelId/" + this.gameModelId + "/read" + relativePath;
        },
        isProcessing: function(node, index) {
            return node.get("loading") || (node instanceof Y.TreeNode ? node._items.some(this.isProcessing, this) : false);
        },
        pathToNode: function(node, path) {
            var i, n = null;
            if (node.path === path) {
                return node;
            } else {
                for (i in node._items) {
                    n = this.pathToNode(node._items[i], path);
                    if (n instanceof Y.TreeNode || n instanceof Y.TreeLeaf) {
                        return n;
                    }
                }
            }
            return null;
        },
        onRequestFailure: function(e) {
            Y.log("onDataSourceError(): Error retrieving data " + (e.response.results.exception || e), "error", "Wegas.FileExplorer");
            try {
                e.cfg.node.set("loading", false);
                Y.Plugin.EditEntityAction.showFormMessage("error", e.response.results.message);
            } catch (e) {
                Y.Plugin.EditEntityAction.showFormMessage("error", "File Not Found");
            } finally {
                Y.Plugin.EditEntityAction.hideEditFormOverlay();
            }
        },
        FileUploader: Y.Base.create("wegas-fileuploader", Y.Widget, [Y.WidgetParent], {
            overallProgress: null,
            uploader: null,
            events: {},
            fileList: [],
            initializer: function() {
                this.fileList = [];
                this.totalBytes = 0;
                this.overallProgress = new Y.Wegas.ProgressBar({
                    color: "lightgrey",
                    width: "100px",
                    height: "10px",
                    percent: 100,
                    label: "Total Upload",
                    showValue: true
                });
                this.uploader = new Y.UploaderHTML5({
                    fileFieldName: "file",
                    selectButtonLabel: "Select File",
                    multipleFiles: true,
                    retryCount: 0
                });
                this.publish("fileuploadcomplete");
                this.publish("fileuploaderror");
            },
            renderUI: function() {
                try {
                    this.get("fileexplorer").toolbar.add(this.overallProgress);
                    this._set(CONTENTBOX, this.get("fileexplorer").toolbar.get("panel").getDOMNode());
                } catch (e) {                                                      //FALLBACK, no toolbar
                    this.get(BOUNDING_BOX).insertBefore("<span>Uploader</span>", this.get(CONTENTBOX));
                    this.overallProgress.render();
                    this.get(BOUNDING_BOX).insertBefore(this.overallProgress.get(BOUNDING_BOX), this.get(CONTENTBOX));
                }
                this.overallProgress.hide();
            },
            bindUI: function() {
                this.events.totalProgress = this.uploader.on("totaluploadprogress", function(e) {
                    var f, uploaded = 0, total = 0;
                    for (f in this.fileList) {
                        uploaded += this.fileList[f].get("bytesUploaded");
                        total += this.fileList[f].get("size");
                    }
                    if (+total === 0 & +uploaded === 0) {
                        total = uploaded = 1;
                    }
                    this.overallProgress.set("percent", uploaded / total * 100);
                }, this);

                this.events.progress = this.uploader.on("uploadprogress", function(e) {
                    e.file.progressBar.set("percent", e.percentLoaded);
                    if (e.file.treeLeaf) {
                        e.file.treeLeaf.get("rightWidget").set("percent", e.percentLoaded);
                    }
                });
                this.events.complete = this.uploader.on("uploadcomplete", function(e) {
                    this.fire("fileuploadcomplete", e);
                }, this);
                this.events.error = this.uploader.on("uploaderror", function(e) {
                    var files = this.fileList, i;
                    for (i = 0; i < files.length; i = i + 1) {
                        if (files[i] === e.file) {
                            files.splice(i, 1);
                            break;
                        }
                    }
                    this.fileList = files;
                    if (this.uploader.queue.queuedFiles.length < 1) {             //@hack start, queue does not continue on failure
                        this.uploader.queue.fire("alluploadscomplete");
                    } else {
                        this.uploader.queue._startNextFile();
                    }
                    this.uploader.fire("totaluploadprogress");                  //@hack end
                    this.fire("fileuploaderror", e);
                }, this);


            },
            destructor: function() {
                for (var i in this.events) {
                    this.events[i].detach();
                }
                this.uploader.destroy();
            },
            addFile: function(file) {
                var uploadDescriptor,
                        progressDiv,
                        detailDiv;
                if (!(new RegExp("^(\\w|\\.| |-|_)+$").test(file.get("name")))) {
                    throw new Error(file.get("name") + ": invalid name. Letters, numbers, whitespace or \".-_\" only");
                } else if (file.get("size") > MAX_FILE_SIZE) {
                    throw new Error(file.get("name") + "[" + FileExplorer.formatFileSize(file.get("size")) + "] is too big. Max file size :" + FileExplorer.formatFileSize(MAX_FILE_SIZE))
                }
                uploadDescriptor = new Y.Node.create("<div/>");
                progressDiv = new Y.Node.create("<div/>");
                detailDiv = new Y.Node.create("<div/>");
                file.treeLeaf.set("rightWidget", new Y.Wegas.ProgressBar({
                    percent: 0,
                    width: "100px",
                    height: "6px",
                    showValue: true,
                    color: "lightgrey"
                }));

                progressDiv.setContent(file.treeLeaf.get("label"));
                detailDiv.setContent("Filename: " + file.get("name") + "<br/>Upload to: " + file.treeLeaf.parentPath + "<br/>Type: " + file.get("type"));
                uploadDescriptor.addClass(this.getClassName("descriptor"));
                progressDiv.addClass(this.getClassName("progress"));
                detailDiv.addClass(this.getClassName("detail"));
                file.progressBar = new Y.Wegas.ProgressBar({
                    percent: 0,
                    width: "99%",
                    height: "4px",
                    color: "lightgrey"
                });
                file.progressBar.render(progressDiv);
                uploadDescriptor.append(progressDiv);
                uploadDescriptor.append(detailDiv);
                this.get(CONTENTBOX).append(uploadDescriptor);
                this.fileList.push(file);
                this.totalBytes += file.get("size");
                this.upload(file);
                this.uploader.set("fileList", this.fileList);
            },
            upload: function(file) {
                this.overallProgress.show();
                file.treeLeaf.set("loading", true);
                this.uploader.uploadThese([file],
                        Y.Wegas.app.get("dataSources").File.source + "upload" + file.treeLeaf.parentPath,
                        {
                            name: file.treeLeaf.get("label")
                        });
            }
        }, {
            NAME: "FileUploader",
            CSS_PREFIX: "fupload",
            ATTRS: {
                fileexplorer: {
                    value: null,
                    writeOnce: "initOnly"
                }

            }
        })

    }, {
        ATTRS: {
            path: {
                value: "/",
                setter: function(val) {
                    return "^/.*".test(val) ? val : "/" + val;
                }
            },
            filter: {
                value: true,
                validator: Y.Lang.isBoolean
            }
        },
        formatFileSize: function(bytes) {
            var precision = 2,
                    sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
                    i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return (bytes / Math.pow(1024, i)).toFixed(precision) + ' ' + sizes[i];
        }
    });

    Y.namespace('Wegas').FileExplorer = FileExplorer;
});
