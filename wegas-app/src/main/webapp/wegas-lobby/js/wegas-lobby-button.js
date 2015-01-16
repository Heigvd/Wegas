/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
            var cb = this.get("contentBox");
            this.uploader = new Y.UploaderHTML5({
                fileFieldName: "file",
                selectButtonLabel: this.get("label"),
                appendNewFiles: false,
                multipleFiles: false,
                withCredentials: false,
                //dragAndDropArea: cb.ancestor(".wegas-lobby-datatable"),
                fileFilters: [{description: "Json", extensions: "*.json"}],
                uploadURL: Wegas.app.get("base") + "rest/GameModel/",
                uploadHeaders: {
                    'Managed-Mode': 'true'
                }
            }).render(cb);
            Y.later(40, this, function() {
                cb.ancestor(".wegas-lobby-datatable").prepend("<div class=\"wegas-dropdummy\">Drop a json file to create a scenario</div>");
                this.uploader.set("dragAndDropArea", cb.ancestor(".wegas-lobby-datatable"));
            });
            this.uploader.on("fileselect", function() {
                this.showOverlay();
                this.uploader.uploadAll();
                this.uploader.set("enabled", false);
            }, this);
            this.uploader.on(["dragenter", "dragover"], function() {
                cb.ancestor(".wegas-lobby-datatable").addClass("wegas-dragover");
            });
            this.uploader.on(["dragleave", "drop"], function() {
                cb.ancestor(".wegas-lobby-datatable").removeClass("wegas-dragover");
            });
            this.uploader.on("uploadcomplete", function(e) {
                this.uploader.set("enabled", true).set("fileList", []);
                try {
                    Wegas.Facade.GameModel.cache._beforeDefDataFn(e);
                } catch (e) {
                    this.showMessage("success", "Error creating scenario");
                    return;
                }
                this.hideOverlay().showMessage("success", "Scenario imported");
            }, this);
            this.uploader.on("uploaderror", function() {
                this.hideOverlay().showMessage("error", "Error creating scenario");
                this.uploader.set("enabled", true).set("fileList", []);
                this.uploader.queue = null; // @hack Otherwise file upload doesnt work after an error
            }, this);
            // this.uploader.on("alluploadscomplete", function() {}, this);
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
            }); // Instantiate treeview
            this.treeView.addTarget(this); // Listen to treeview's events
            this.treeView.render(this.get(CONTENTBOX)); // Render treeview  

            this.plug(Plugin.WidgetToolbar);
            this.toolbar.add({
                label: "<span class='wegas-icon wegas-icon-save'></span>Create version",
                on: {
                    click: Y.bind(function() {
                        this.showOverlay();
                        Wegas.Facade.GameModel.sendRequest({
                            request: "/" + this.get("entity").get("id") + "/CreateVersion",
                            cfg: {
                                method: "POST",
                                updateCache: false
                            },
                            on: {
                                success: Y.bind(function() {
                                    this.hideOverlay();
                                    this.syncUI();
                                }, this),
                                failure: Y.bind(this.hideOverlay, this)
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
                        success: Y.bind(function() {
                            this.hideOverlay();
                            this.syncUI();
                        }, this),
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
                        success: Y.bind(function() {
                            this.hideOverlay();
                            this.syncUI();
                        }, this),
                        failure: Y.bind(this.hideOverlay, this)
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
                    failure: Y.bind(this.hideOverlay, this)
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
