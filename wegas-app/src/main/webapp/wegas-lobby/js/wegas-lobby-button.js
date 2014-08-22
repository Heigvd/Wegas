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
YUI.add('wegas-lobby-button', function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Plugin = Y.Plugin, Wegas = Y.Wegas;

    /**
     * @name Y.Wegas.UploadFileButton
     * @extends Y.Wegas.Widget
     * @class 
     * @constructor
     */
    Wegas.UploadFileButton = Y.Base.create("wegas-uploadfile", Y.Widget, [Y.WidgetChild, Wegas.Editable, Wegas.Widget], {
        /** @lends Y.Wegas.UploadFileButton# */
        /**
         * @function
         * @private
         */
        renderUI: function() {
            this.uploader = new Y.UploaderHTML5({
                fileFieldName: "file",
                selectButtonLabel: this.get("label"),
                appendNewFiles: false,
                multipleFiles: false,
                withCredentials: false,
                fileFilters: [{description: "Json", extensions: "*.json"}],
                uploadURL: Wegas.app.get("base") + "rest/GameModel/",
                uploadHeaders: {
                    'Managed-Mode': 'true'
                }
            }).render(this.get(CONTENTBOX));

            this.uploader.on("fileselect", function() {
                this.showOverlay();
                uploader.uploadAll();
                uploader.set("enabled", false);
            }, this);
            this.uploader.on("uploadcomplete", function(e) {
                this.hideOverlay();
                uploader.set("enabled", true);
                uploader.set("fileList", []);
                try {
                    Wegas.Facade.GameModel.cache._beforeDefDataFn(e);
                } catch (e) {
                    this.showMessageBis("success", "Error uploading scnenario");
                    return;
                }
                this.showMessageBis("success", "Scenario imported");
            }, this);
            // uploader.on("alluploadscomplete", function() {}, this);
            this.uploader.on("uploaderror", function() {
                this.hideOverlay();
                uploader.set("enabled", true);
                uploader.set("fileList", []);
                this.showMessageBis("error", "Error uploading scnenario");
            }, this);
        },
        destructor: function() {
            this.uploader.destroy();
        }
    }, {
        ATTRS: {
            label: {
                value: "Upload"
            }
        }
    });

    /**
     * @name Y.Wegas.GameModelHistory
     * @extends Y.Wegas.Widget
     * @class 
     * @constructor
     */
    Wegas.GameModelHistory = Y.Base.create("history", Y.Widget, [Y.WidgetChild, Wegas.Editable, Wegas.Widget], {
        /** @lends Y.Wegas.GameModelHistory# */
        /**
         * @function
         * @private
         */
        renderUI: function() {
            this.treeView = new Y.TreeView({
                emptyMsg: "No version created yet"
            });                                                                 // Instantiate treeview
            this.treeView.addTarget(this);                                      // Listen to treeview's events
            this.treeView.render(this.get(CONTENTBOX));                         // Render treeview  

            this.plug(Plugin.WidgetToolbar);
            this.toolbar.add({
                label: "<span class='wegas-icon wegas-icon-save'></span>Create version",
                on: {
                    click: Y.bind(function() {
                        this.showOverlay();
                        Wegas.Facade.GameModel.sendRequest({
                            request: "/" + this.get("entity").get("id") + "/CreateVersion",
                            cfg: {
                                updateCache: false
                            },
                            on: {
                                success: Y.bind(this.syncUI, this),
                                failure: Y.bind(this.defaultFailureHandler, this)
                            }
                        });
                    }, this)
                }
            });
        },
        bindUI: function() {
            var cb = this.get(CONTENTBOX);

            cb.delegate("mouseup", function(e) {
                var data = Y.Widget.getByNode(e.currentTarget).get("data");
                this.showOverlay();
                Wegas.Facade.GameModel.sendRequest({
                    request: "/" + this.get("entity").get("id") + "/Restore/History/" + data.name,
                    on: {
                        success: Y.bind(this.syncUI, this),
                        failure: Y.bind(this.hideOverlay, this)
                    }
                });
            }, ".button-restore", this);
            cb.delegate("mouseup", function(e) {
                var data = Y.Widget.getByNode(e.currentTarget).get("data");
                this.showOverlay();
                Wegas.Facade.GameModel.sendRequest({
                    request: "/" + this.get("entity").get("id") + "/File/delete" + data.path + "/" + data.name,
                    cfg: {
                        updateCache: false,
                        method: 'DELETE'
                    },
                    on: {
                        success: Y.bind(this.syncUI, this),
                        failure: Y.bind(this.defaultFailureHandler, this)
                    }
                });
            }, ".button-remove", this);
        },
        syncUI: function() {
            Y.log("syncUI()", "info", "Wegas.GameModelHistory");
            this.showOverlay();
            Wegas.Facade.GameModel.sendRequest({
                request: "/" + this.get("entity").get("id") + "/File/list/History",
                cfg: {
                    updateCache: false
                },
                on: {
                    success: Y.bind(function(e) {
                        var nodes = Y.Array.map(e.response.entities.reverse(), function(f) {
                            return {
                                type: "TreeLeaf",
                                label: f.get("val.name").replace(".json", ""),
                                data: f.get("val"),
                                iconCSS: "wegas-icon-gamemodel",
                                rightWidget: Y.Node.create("<div>"
                                    + '<button class="yui3-button button-restore" title="Create a scenario based on this version"><span class="wegas-icon wegas-icon-restore"></span></button>'
                                    + '<button class="yui3-button button-remove" title="Delete version"><span class="wegas-icon wegas-icon-delete"></span></button>'
                                    + "</div>")
                            };
                        });
                        this.treeView.destroyAll();
                        this.treeView.add(nodes);
                        this.treeView.syncUI();
                        this.hideOverlay();
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        destructor: function() {
            this.treeView.destroy();
        }
    }, {
        ATTRS: {
            entity: {}
        }
    });
});
