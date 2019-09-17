/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add('wegas-fileexplorer', function(Y) {
    'use strict';
    var FileUploader,
        FileExplorer,
        Wegas = Y.Wegas,
        JSON = Y.JSON,
        CONTENTBOX = 'contentBox',
        BOUNDING_BOX = 'boundingBox',
        LABEL = 'label',
        MAX_FILE_SIZE = 20000000,
        FILENAME = new RegExp(
            '^(\\w|\\.| |-|_|' + Y.Wegas.Helper.Diacritics.isDiacritics + ')+$'
            ),
        DEFAULTHEADERS = {
            'Content-Type': 'application/json; charset=UTF-8',
            'Managed-Mode': false
        },
        BASEMENU = [{
                label: 'Upload file',
                cssClass: 'wegas-icon wegas-icon-newfile',
                //tooltip: "Add a file",
                data: 'add file'
            },
            {
                label: 'New folder',
                cssClass: 'wegas-icon wegas-icon-newdir',
                //tooltip: "Add a folder",
                data: 'add dir'
            }
            //{
            //    label: "Refresh",
            //    cssClass: "wegas-icon wegas-icon-refresh",
            //    //tooltip: "Refresh",
            //    data: "refresh"
            //}
        ],
        genLabel = function(data) {
            return data.name;
        },
        endsWith = function(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };


    FileExplorer = Y.Base.create('wegas-fileexplorer', Y.Widget, [Wegas.Widget, Y.WidgetChild], {
        // ** Private fields ** //
        directoryMimeType: 'application/wfs-directory',
        // *** Lifecycle methods ** //
        initializer: function() {
            this.rootPath = '/';
            this.search = null;
            this.tooltip = null;
            this.uploader = new Y.UploaderHTML5({
                width: '100px',
                fileFieldName: 'file',
                selectButtonLabel: 'Browse',
                appendNewFiles: false
            });
            this.uploader.currentNode = null;
            this.fakeFile = new Y.FileHTML5({});
            this.publish('fileSelected', {
                bubbles: true,
                emitFacade: true,
                defaultFn: function(e) {
                    this.processMenuClick('edit', e.node, {
                        data: e.node.get('data')
                    });
                }
            });
            this.publish('directorySelected', {
                bubbles: true,
                emitFacade: true,
                defaultFn: function(e) {
                    this.processMenuClick('edit', e.node, {
                        data: e.node.get('data')
                    });
                }
            });
            this.fileUploader = new FileUploader({
                visible: true,
                fileexplorer: this
            });
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX), menu;
            Y.log('renderUI()', 'log', 'Wegas.FileExplorer');
            if (this.get('filter')) {
                this.treeView = new Y.TreeView({
                    visibleRightWidget: false,
                    plugins: [{
                            fn: Y.Plugin.TreeViewFilter,
                            cfg: {
                                testFn: function(searchVal) {
                                    var ret;
                                    searchVal = Y.Lang.trim(searchVal);
                                    ret = searchVal === '';
                                    if (!ret) {
                                        ret = (this.data.name || "").toLowerCase().indexOf(searchVal.toLowerCase()) > -1;

                                    }
                                    if (!ret && this.get('data') && this.get('data.mimeType')) {
                                        ret = this.get('data.mimeType').toLowerCase()
                                            .indexOf(searchVal.toLowerCase()) === 0;
                                    }
                                    return ret;
                                }
                            }
                        }
                    ]
                });
            } else {
                this.treeView = new Y.TreeView({
                    visibleRightWidget: false
                });
            }

            menu = new Wegas.WegasMenu({
                items: BASEMENU,
                horizontal: true,
                eventTarget: this,
                params: {
                    path: ''
                }
            });
            if (this.toolbar) {
                this.rootNode = this.treeView;
            } else {
                this.rootNode = new Y.TreeNode({
                    collapsed: false,
                    label: '/',
                    rightWidget: null,
                    data: {mimeType: this.directoryMimeType, name: '/'}
                });
                this.treeView.add(this.rootNode);
            }

            this.rootNode.path = this.rootPath;
            this.listNodeData(this.rootNode); // Load root node content
            this.uploader.render().hide();


            Wegas.Facade.File.sendRequest({
                request: 'meta' + this.rootPath,
                cfg: {
                    headers: DEFAULTHEADERS
                },
                on: {
                    success: Y.bind(function(e) {
                        menu.set(
                            'params.data',
                            new Wegas.persistence.Directory(
                                e.response.results
                                )
                            );
                        if (this.toolbar) {
                            this.rootMenu = menu;
                            this.rootMenu.render(this.toolbar.get('header'));
                            this.rootMenu.on('itemClick', function(e) {
                                this.processMenuClick(e.data, this.rootNode, e.params);
                            }, this);
                        } else {
                            this.rootNode.set('rightWidget', menu);
                        }
                    }, this),
                    failure: Y.bind(this.onRequestFailure, this)
                }
            });
            this.treeView.render(cb);
            this.fileUploader.render(cb).hide();
            if (this.get('filter')) {
                this.search = Y.Node.create(
                    "<input class='treeview-search' type='text' placeholder='Search...'/>"
                    );
                if (this.toolbar) {
                    this.toolbar.get('header').append(this.search);
                    this.search.wrap(
                        "<div class='wegas-filter-input'></div>"
                        );
                } else {
                    this.get('boundingBox').append(this.search);
                    this.search.hide();
                    this.search.after('blur', function() {
                        if (this.getDOMNode().value === '') {
                            this.hide();
                        }
                    });
                }
            }
            cb.append(
                "<div class='fileexplorer-footer'>Upload files by dragging & dropping them on a folder</div>"
                );
            this.tooltip = new Wegas.Tooltip({
                delegate: cb,
                delegateSelect: '.yui3-treeleaf-content-label',
                render: true,
                autoHideDelay: 20000
            });
        },
        bindUI: function() {
            this.tooltip.on('tooltipShow', function(e) {
                // The tooltip content is set on the fly based on the node
                var leaf = Y.Widget.getByNode(e.node), ret = '';
                if (!leaf.data) {
                    return;
                }
                if (leaf.data.mimeType.indexOf('image') > -1) {
                    ret += '<img src="' + this.getFullPath(leaf.path) + "?t=" + new Date().getTime() + '" /><br />';
                }
                ret += leaf.data.mimeType + '<br />';
                ret += FileExplorer.formatFileSize(leaf.data.bytes) + '<br /';
                this.tooltip.setTriggerContent(ret);
            }, this);

            //Prevent drop to avoid application exit
            this.get(BOUNDING_BOX).on('drop', function(e) {
                e.halt(true);
            });
            this.get(BOUNDING_BOX).on('dragover', function(e) {
                e._event.dataTransfer.dropEffect = 'none';
                e.halt(true);
            });

            this.rootNode.get(BOUNDING_BOX).delegate('drop', function(e) {
                var i,
                    file,
                    node = Y.Widget.getByNode(e.currentTarget),
                    files = e._event.dataTransfer.files;
                e.currentTarget.removeClass('fileexplorer-drag-over');
                e.halt(true);
                for (i = 0; i < files.length; i = i + 1) {
                    if (files[i].type !== '') {
                        file = new Y.FileHTML5({
                            file: files[i]
                        });
                        file.treeLeaf = new Y.TreeLeaf({
                            label: file.get('name')
                        });
                        try {
                            node.add(file.treeLeaf);
                        } catch (er) {
                            // TODO: find out that after a delete
                        }
                        file.treeLeaf.parentPath = node.path + "/";
                        try {
                            this.fileUploader.addFile(file);
                        } catch (er) {
                            this.showMessage('error', er.message);
                            file.treeLeaf.destroy();
                        }
                    } else {
                        this.showMessage('error', 'Unknown file type');
                    }
                }
            }, '.yui3-treenode, .yui3-treeview', this);

            this.rootNode.get(BOUNDING_BOX).delegate('dragover', function(e) {
                var node = Y.Widget.getByNode(e.currentTarget);
                e.halt(true);
                e.currentTarget.addClass('fileexplorer-drag-over');
                if (node.expand) {
                    node.expandTimeout =
                        node.expandTimeout ||
                        Y.later(300, node, node.expand);
                }
            }, '.yui3-treenode, .yui3-treeview');

            this.rootNode.get(BOUNDING_BOX).delegate('dragleave', function(e) {
                var node = Y.Widget.getByNode(e.currentTarget);
                e.halt(true);
                if (node.expandTimeout) {
                    node.expandTimeout.cancel();
                    delete node.expandTimeout;
                }
                e.currentTarget.removeClass('fileexplorer-drag-over');
            }, '.yui3-treenode, .yui3-treeview');

            this.treeView.on('*:nodeExpanded', function(e) {
                this.listNodeData(e.node);
            }, this);

            this.treeView.after('treeleaf:click', function(e) {
                if (e.node.path) {
                    this.fire('fileSelected', {node: e.node}, e.node.path);
                }
            }, this);

            this.treeView.on(['treenode:iconClick', 'treenode:labelClick'], function(e) {
                if (e.node.path) {
                    this.fire('directorySelected', {node: e.target});
                }
            }, this);

            this.treeView.on('wegas-menu:itemClick', function(e) {
                this.processMenuClick(e.data, e.target.get('parent'), e.params);
            }, this);

            this.fakeFile.after('uploadcomplete', function(e) {
                var n = this.pathToNode(
                    this.rootNode,
                    Y.JSON.parse(e.data).path
                    );
                if (n.expand) {
                    n.expand();
                }
                n.add(this.createNode(e.data));
                //    this.showMessage("success", "Folder successfully created");
            }, this);

            this.uploader.after('fileselect', function(e) {
                if (this.uploader.parentNode.get(LABEL) === 'Filename') {
                    this.uploader.parentNode.set(LABEL, e.fileList[0].get('name'));
                }
                this.editNode.show();

                var file = e.fileList[0];
                file.treeLeaf = this.uploader.parentNode;

                if (this.uploader.parentNode.path) {
                    // update new version
                    var path = this.uploader.parentNode.path;
                    file._set('name', path.substring(path.lastIndexOf("/") + 1));
                } else {
                    file._set('name', file.get('name'));
                }

                this.uploadFile(file);

                return;

                // Case 2: Display buttons
                /*this.uploader.parentNode.set("rightWidget", new Wegas.WegasMenu({
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
                 }));*/
            }, this);

            this.fileUploader.on('fileuploadcomplete', function(e) {
                e.file.treeLeaf.set('loading', false);
                var node = this.createNode(e.data);
                node
                    .get(BOUNDING_BOX)
                    .setStyle('animation', 'highlight 1s .5s');
                if (node) {
                    e.file.treeLeaf.get('parent').add(node);
                    //      this.showMessage("success", JSON.parse(e.data).name + " successfully uploaded");
                } else {
                    e.file.progressBar.set('color', 'red');
                    this.showMessage('error', 'Error uploading "' + JSON.parse(e.data).name + '"');
                }
                try {
                    e.file.treeLeaf.destroy();
                } catch (ex) {
                }
            }, this);

            this.fileUploader.on('fileuploaderror', function(e) {
                e.file.progressBar.set('color', 'red');
                e.file.treeLeaf.set('loading', false);

                var error = JSON.parse(e.data);
                if (error && error["@class"] === "WegasErrorMessage"
                    && endsWith(error.message, ' already exists')) {
                    Y.Wegas.Panel.confirm(error.message + '<br>Overwrite it ?<br><small>you will have to refresh your browser to see changes</small>',
                        Y.bind(function() {
                            this.treeView.find(function(i) {
                                return (i !== e.file.treeLeaf && i && i.data && i.data.name === e.file.get('name'));
                            }).destroy();
                            this.fileUploader.addFile(e.file, true);
                        }, this),
                        function() {
                            try {
                                e.file.treeLeaf.destroy();
                            } catch (ex) {
                            }
                        }
                    );
                } else {
                    try {
                        e.file.treeLeaf.destroy();
                    } catch (ex) {
                    }
                    this.showMessage('error', error && error.message || "Unexpeced Error");
                }
            }, this);

            if (this.search) {
                this.before('keydown', function(e) {
                    if (e.domEvent.ctrlKey &&
                        String.fromCharCode(e.domEvent.charCode).toUpperCase() === 'F') {
                        e.domEvent.preventDefault();
                        this.search.focus();
                        this.search.show();
                    }
                });
                this.search.after('keyup', function(e) {
                    this.treeView.filter.set(
                        'searchVal',
                        this.search.getDOMNode().value
                        );
                }, this);
            }
        },
        destructor: function() {
            if (this.rootMenu) {
                this.rootMenu.destroy();
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
                node.set('loading', true);
                Wegas.Facade.File.sendRequest({
                    request: 'list' + node.path,
                    cfg: {
                        headers: DEFAULTHEADERS,
                        node: node
                    },
                    on: {
                        success: Y.bind(
                            this.onListRequestSuccess,
                            this,
                            callback
                            ),
                        failure: Y.bind(this.onRequestFailure, this)
                    }
                });
            }
        },
        uploadFile: function(file) {
            //            file.treeLeaf = node;
            this.uploader.set('fileList', []);
            this.uploader.disable();
            this.uploader.hide();
            try {
                this.fileUploader.addFile(file);
            } catch (e) {
                this.showMessage('error', e.message);
                file.treeLeaf.remove();
            }
        },
        processMenuClick: function(action, node, params) {
            var path, method, name, file, tmp;
            if (!action) {
                return;
            }
            switch (action) {
                case 'cancel':
                    node.destroy();
                    break;
                case 'upload':
                    file = params.file;
                    file._set('name', node.data.name);
                    file.treeLeaf = node;
                    node.set('editable', false);
                    this.uploadFile(file);
                    break;
                case 'update file':
                    this.uploader.openFileSelectDialog();
                    node.path = params.path;
                    this.addFile(node, false);
                    break;
                case 'add file':
                    // Directly show the file panel directly (comment to force the user to click on the browse button)
                    this.uploader.openFileSelectDialog();
                    this.addFile(node, true);
                    break;
                case 'refresh':
                    this.refresh(node);
                    break;
                case 'add dir':
                    Y.Wegas.Panel.prompt("Folder's name:", Y.bind(function(name) {
                        path = Wegas.Facade.File.get('source') + 'upload' + node.path;
                        if (name === null) {
                            return;
                        } else if (name === '') {
                            this.showMessage('error', "Folder's name is required");
                            //                        } else if (!(FILENAME.test(name))) {
                            //                            this.showMessage("error",
                            //                                "Invalid name: " + name + ". Letters, numbers, whitespace
                            // or \".-_\" only");
                        } else {
                            this.uploader.upload(this.fakeFile, path, {
                                name: name
                            });
                        }
                    }, this));
                    break;
                case 'edit':
                    Y.Plugin.EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                        Y.Plugin.EditEntityAction.showEditForm(
                            params.data,
                            Y.bind(this.editContent, this, node)
                            );
                    }, this));
                    break;
                case 'open':
                    this.openFile(params.path);
                    break;
                case 'delete':
                    if (!this.isProcessing(node)) {
                        path = 'post_delete';
                        method = 'POST';

                        Wegas.Panel.confirm('Delete: ' + node.path + '?',
                            Y.bind(function() {
                                Wegas.Facade.File.sendRequest({
                                    request: path,
                                    cfg: {
                                        headers: {
                                            'Content-Type': 'text/plain; charset=UTF-8',
                                            'Managed-Mode': false
                                        },
                                        method: method,
                                        node: node,
                                        data: node.path,
                                    },
                                    on: {
                                        success: Y.bind(this.removeNode, this),
                                        failure: Y.bind(this._onDeleteFailure, this)
                                    }
                                });
                            }, this)
                            );
                    }
                    break;
                default:
                    Y.log('Not implemented yet :' + action, 'warn', 'Y.Wegas.FileExplorer');
            }
        },
        _onDeleteFailure: function(e) {
            var current = this, result = Y.JSON.parse(e.response.results);
            if (result.message.indexOf('is not empty') > -1) {
                new Wegas.Panel({
                    content: result.message + '<br><br> Would you delete it anyway?',
                    buttons: {
                        footer: [{
                                label: 'Delete',
                                action: function() {
                                    Wegas.Facade.File.sendRequest({
                                        request: 'force/delete' +
                                            e.cfg.node.path,
                                        cfg: e.cfg,
                                        on: {
                                            success: Y.bind(current.removeNode, current),
                                            failure: Y.bind(current.onRequestFailure, current)
                                        }
                                    });
                                    this.exit();
                                }
                            }, {
                                label: 'Cancel',
                                action: 'exit'
                            }
                        ]
                    }
                }).render();
            } else {
                this.onRequestFailure(e);
            }
        },
        editContent: function(node, data) {
            Wegas.Facade.File.sendRequest({
                request: 'update/' +
                    node.path.substring(1, node.path.length), //remove first "/"
                cfg: {
                    headers: DEFAULTHEADERS,
                    method: 'PUT',
                    data: Y.JSON.stringify(data),
                    node: node,
                    scope: this
                },
                on: {
                    success: this.updateContent,
                    failure: Y.bind(this.onRequestFailure, this)
                }
            });
        },
        updateContent: function(e) {
            var node = e.cfg.node, data = e.response.results;
            node.get('rightWidget').get('params').data.setAttrs(data);
            node.set('label', genLabel(data));
            Y.Plugin.EditEntityAction.showFormMessage(
                'success',
                data.name + ' successfully updated.'
                );
            Y.Plugin.EditEntityAction.hideEditFormOverlay();
            e.cfg.scope.refresh(node);
        },
        onListRequestSuccess: function(callback, e) {
            if (
                this.editNode &&
                this.editNode.get('parent') === e.cfg.node
                ) {
                this.editNode.set('rightWidget', null);
            }
            e.cfg.node.destroyAll();
            for (var i = 0; i < e.response.results.length; i += 1) {
                e.cfg.node.add(this.createNode(e.response.results[i]));
            }
            e.cfg.node.set('loading', false);
            if (callback) {
                callback.call(this, e);
            }
        },
        createNode: function(data) {
            var childNode, conf, descriptor,
                menuItems;

            if (Y.Lang.isString(data)) {
                data = JSON.parse(data);
            }
            if (!data.mimeType) {
                return null;
            }
            if (data.mimeType === this.directoryMimeType) {
                descriptor = new Wegas.persistence.Directory(data);
                menuItems = [];

                if (!Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().dependsOnModel()
                    || descriptor.get("visibility") === "PRIVATE"
                    || descriptor.get("visibility") === "INHERITED") {
                    // INERITED OR PRIVATE
                    menuItems.push({
                        label: '',
                        cssClass: 'wegas-icon wegas-icon-newfile',
                        tooltip: 'Upload a file',
                        data: 'add file'
                    }, {
                        label: '',
                        cssClass: 'wegas-icon wegas-icon-newdir',
                        tooltip: 'Add a folder',
                        data: 'add dir'
                    });
                }

                if (!Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().dependsOnModel()
                    || descriptor.get("visibility") === "PRIVATE") {
                    // private
                    menuItems.push({
                        label: '',
                        cssClass: 'wegas-icon wegas-icon-delete',
                        tooltip: 'Delete folder',
                        data: 'delete'
                    });

                    //{
                    //    label: "",
                    //    cssClass: "wegas-icon wegas-icon-refresh",
                    //    tooltip: "Refresh",
                    //    data: "refresh"
                    //},
                }
                childNode = new Y.TreeNode({
                    label: genLabel(data),
                    rightWidget: new Wegas.WegasMenu({
                        items: menuItems,
                        horizontal: true,
                        params: {
                            path: data.path +
                                (data.path.match('.*/$') ? '' : '/') +
                                data.name,
                            data: descriptor
                        }
                    }),
                    data: descriptor
                });
            } else {
                descriptor = new Wegas.persistence.File(data);
                menuItems = [{
                        cssClass: 'fa fa-external-link',
                        tooltip: 'Open',
                        data: 'open'
                    }];

                if (!Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().dependsOnModel()
                    || descriptor.get("visibility") === "PRIVATE") {
                    menuItems.push({
                        label: '',
                        cssClass: 'wegas-icon wegas-icon-mewfile',
                        tooltip: 'Upload new version',
                        data: 'update file'
                    });
                    menuItems.push({
                        label: '',
                        cssClass: 'wegas-icon wegas-icon-delete',
                        tooltip: 'Delete file',
                        data: 'delete'
                    });
                }

                conf = {
                    label: genLabel(data),
                    iconCSS: 'wegas-icon-' +
                        data.mimeType.replace('/', '-') +
                        ' wegas-icon-file',
                    data: descriptor,
                    rightWidget: new Wegas.WegasMenu({
                        items: menuItems,
                        horizontal: true,
                        params: {
                            path: data.path +
                                (data.path.match('.*/$') ? '' : '/') +
                                data.name,
                            data: descriptor
                        }
                    })
                };


                //if(data.mimeType.indexOf("image") > -1){
                // conf.iconCSS += " image-icon";
                //conf.label = data.name;
                //}
                childNode = new Y.TreeLeaf(conf);
                childNode.data = data;
            }

            childNode.path =
                data.path +
                (data.path.match('.*/$') ? '' : '/') +
                data.name;
            return childNode;
        },
        removeNode: function(event) {
            //    this.showMessage("success", "Item deleted");
            event.cfg.node.destroy();
        },
        refresh: function(node) {
            if (node.expand && !node.get('collapsed')) {
                this.listNodeData(node);
            }
        },
        addFile: function(event, refresh) {
            var node;
            if (event instanceof Y.TreeNode || event instanceof Y.TreeView) {
                node = event;
            } else if (event instanceof Y.TreeLeaf) {
                node = event;
            } else {
                node = event.cfg.node;
            }
            if (refresh) {
                if (this.editNode && this.editNode.get('rightWidget') instanceof Y.UploaderHTML5) {
                    this.editNode.set('rightWidget', null);
                    this.editNode.destroy();
                    this.editNode = null;
                }
                if (this.isProcessing(node)) {
                    this.addFile(node);
                }
                this.listNodeData(node, this.addFile);
            } else {
                if (event instanceof Y.TreeLeaf) {
                    this.editNode = node;
                } else {
                    this.editNode = new Y.TreeLeaf({
                        label: 'Filename',
                        editable: true,
                        loading: false,
                        rightWidget: this.uploader
                    });
                }
                this.uploader.parentNode = this.editNode;
                this.editNode.parentPath = node.path;

                if (node !== this.editNode) { //hack to detect if user is updating an existing file
                    node.add(this.editNode);
                    this.editNode.hide();

                    if (!this.editNode.parentPath.endsWith("/")) {
                        this.editNode.parentPath += "/";
                    }
                }

                if (node.expand) {
                    node.expand(false);
                }
                this.uploader.show();
                this.uploader.enable();
                this.uploader.get(BOUNDING_BOX).scrollIntoView();
                //In case rightWidget opacity change.
                this.uploader.get(BOUNDING_BOX).get('parentNode').setStyle('opacity', 1); //force opacity to 1 on
                // rightWidget
            }
            return true;
        },
        openFile: function(path) {
            window.open(this.getFullPath(path));
        },
        getFullPath: function(relativePath) {
            return (
                Wegas.app.get('base') +
                'rest/GameModel/' +
                Wegas.Facade.GameModel.get('currentGameModelId') +
                '/File/read' +
                relativePath
                );
        },
        isProcessing: function(node) {
            return (
                node.get('loading') ||
                (node instanceof Y.TreeNode
                    ? node._items.some(this.isProcessing, this)
                    : false)
                );
        },
        pathToNode: function(node, path) {
            var i, n = null;
            if (node.path === path) {
                return node;
            } else {
                for (i in node._items) {
                    if (node._items.hasOwnProperty(i)) {
                        n = this.pathToNode(node._items[i], path);
                        if (n instanceof Y.TreeNode || n instanceof Y.TreeLeaf) {
                            return n;
                        }
                    }
                }
            }
            return null;
        },
        onRequestFailure: function(e) {
            Y.log(
                'onDataSourceError(): Error retrieving data ' +
                (e.response.results.exception || e),
                'error',
                'Wegas.FileExplorer'
                );
            e.cfg.node.set('loading', false);
            this.showMessage('error', e.response.results.message);
        }
    },
        {
            ATTRS: {
                path: {
                    value: '/',
                    setter: function(val) {
                        return '^/.*'.test(val) ? val : '/' + val;
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
                return (
                    (bytes / Math.pow(1024, i)).toFixed(precision) +
                    ' ' +
                    sizes[i]
                    );
            }
        }
    );


    Wegas.FileExplorer = FileExplorer;
    FileUploader = Y.Base.create('wegas-fileuploader', Y.Widget, [Y.WidgetParent], {
        initializer: function() {
            this.fileList = [];
            this.totalBytes = 0;
            this.overallProgress = new Wegas.ProgressBar({
                color: 'lightgrey',
                width: '100px',
                height: '10px',
                percent: 100,
                label: 'Upload',
                showValue: true
            });
            this.uploader = new Y.UploaderHTML5({
                fileFieldName: 'file',
                selectButtonLabel: 'Browse',
                multipleFiles: true,
                retryCount: 0
            });
            this.publish('fileuploadcomplete');
            this.publish('fileuploaderror');
        },
        renderUI: function() {
            if (this.toolbar) {
                this.overallProgress.render(this.toolbar.get('header'));
                this._set(CONTENTBOX, this.get('fileexplorer').toolbar.get('panel').getDOMNode());
            } else {
                //FALLBACK, no toolbar
                this.get(BOUNDING_BOX).insertBefore('<span>Uploader</span>', this.get(CONTENTBOX));
                this.overallProgress.render();
                this.get(BOUNDING_BOX).insertBefore(this.overallProgress.get(BOUNDING_BOX), this.get(CONTENTBOX));
            }
            this.overallProgress.hide();
        },
        bindUI: function() {
            this.uploader.on('totaluploadprogress', function(e) {
                var f, uploaded = 0, total = 0;
                for (f = 0; f < this.fileList.length; f += 1) {
                    uploaded += this.fileList[f].get('bytesUploaded');
                    total += this.fileList[f].get('size');
                }
                if (+total === 0 && +uploaded === 0) {
                    total = uploaded = 1;
                }
                this.overallProgress.set('percent', uploaded / total * 100);
            },
                this
                );

            this.uploader.on('uploadprogress', function(e) {
                e.file.progressBar.set('percent', e.percentLoaded);
                if (e.file.treeLeaf) {
                    e.file.treeLeaf
                        .get('rightWidget')
                        .set('percent', e.percentLoaded);
                }
            });

            this.uploader.on('uploadcomplete', function(e) {
                this.fire('fileuploadcomplete', e);
            }, this);

            this.uploader.on('uploaderror', function(e) {
                var files = this.fileList, i;
                for (i = 0; i < files.length; i = i + 1) {
                    if (files[i] === e.file) {
                        files.splice(i, 1);
                        break;
                    }
                }
                this.fileList = files;
                if (this.uploader.queue.queuedFiles.length < 1) {
                    //@hack start, queue does not continue on failure
                    this.uploader.queue.fire('alluploadscomplete');
                } else {
                    this.uploader.queue._startNextFile();
                }
                this.uploader.fire('totaluploadprogress'); //@hack end

                this.fire('fileuploaderror', e);
            }, this);
        },
        destructor: function() {
            this.uploader.destroy();
        },
        addFile: function(file, force) {
            /*    if (!(FILENAME.test(file.get("name")))) {
             throw new Error("Invalid name: " + file.get("name") + ". Letters, numbers, whitespace or \".-_\" only");
             } else */
            if (file.get('size') > MAX_FILE_SIZE) {
                throw new Error(file.get('name') +
                    ' (' + FileExplorer.formatFileSize(file.get('size')) + ') is too big. Max file size :' +
                    FileExplorer.formatFileSize(MAX_FILE_SIZE));
            }
            var uploadDescriptor = new Y.Node.create('<div/>'),
                progressDiv = new Y.Node.create('<div/>'),
                detailDiv = new Y.Node.create('<div/>');
            file.treeLeaf.set(
                'rightWidget',
                new Wegas.ProgressBar({percent: 0, width: '100px', height: '6px', showValue: true, color: 'lightgrey'})
                );
            progressDiv.setContent(file.treeLeaf.get(LABEL));
            detailDiv.setContent('Filename: ' + file.get('name')
                + '<br/>Upload to: ' + file.treeLeaf.parentPath
                + '<br/>Type: ' + file.get('type'));
            uploadDescriptor.addClass(this.getClassName('descriptor'));
            progressDiv.addClass(this.getClassName('progress'));
            detailDiv.addClass(this.getClassName('detail'));
            file.progressBar = new Wegas.ProgressBar({
                percent: 0,
                width: '99%',
                height: '4px',
                color: 'lightgrey'
            });
            file.progressBar.render(progressDiv);
            uploadDescriptor.append(progressDiv);
            uploadDescriptor.append(detailDiv);
            this.get(CONTENTBOX).append(uploadDescriptor);
            this.fileList.push(file);
            this.totalBytes += file.get('size');
            this.upload(file, force);
            this.uploader.set('fileList', this.fileList);
        },
        upload: function(file, force) {
            //this.overallProgress.show();
            file.treeLeaf.set('loading', true);

            var path = file.treeLeaf.parentPath;
            var lastSlash = path.lastIndexOf("/");

            if (lastSlash >= 0 && lastSlash !== path.length - 1) {
                path = path.substring(0, path.lastIndexOf("/") + 1);
                force = true;
            }

            Y.log("Upload File: " + file);
            this.uploader.uploadThese([file],
                Wegas.Facade.File.get('source') + (force ? 'force/' : '') + 'upload' + path/*,
                 {
                 name: file.treeLeaf.get(LABEL)
                 }*/
                );
        }
    },
        {
            NAME: 'FileUploader',
            CSS_PREFIX: 'fupload',
            ATTRS: {
                fileexplorer: {
                    value: null,
                    writeOnce: 'initOnly'
                }
            }
        }
    );
});
