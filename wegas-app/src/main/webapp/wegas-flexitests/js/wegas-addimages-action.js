/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-addimages-action", function(Y) {
    "use strict";

    /**
     * Add images all images from specified file directory
     * @constructor
     * @name Y.Plugin.AddImagesWidgetAction
     * @extends Y.Plugin.Action
     */
    var AddImagesWidget = function() {
        AddImagesWidget.superclass.constructor.apply(this, arguments);
    };
    Y.extend(AddImagesWidget, Y.Plugin.Action, {
        /** @lends Y.Plugin.AddImagesWidgetAction# */
        execute: function() {
//            var dir = prompt("Directory to add", "/");
            this.fs = new Y.Wegas.FileSelect({
                title: "Choose a directory",
                filter: function() {
                    return /application\/wfs-directory/.test(this.get("data.mimeType"));
                }
            });
            this.fs.on("directorySelected", function(e, path) {
                this.get("fileDataSource").sendRequest({
                    request: "list" + path,
                    cfg: {
                        headers: {
                            'Content-Type': 'application/json; charset=UTF-8',
                            'Managed-Mode': false
                        }
                    },
                    on: {
                        success: Y.bind(function(e) {
                            this._processNodes(e.response.results);
                        }, this),
                        failure: null
                    }
                });
                this.fs.destroy();
            }, this);
        },
        _processNodes: function(list) {
            var path, i;
            for (i = 0; i < list.length; i += 1) {
                if (list[i].mimeType.match("image/.*")) {
                    path = list[i].path + (list[i].path.match(".*/$") ? "" : "/") + list[i].name;
                    this.get("widget").add({type: "Image", url: path});
                }
            }
            this.get("dataSource").cache.patch(this.get("widget").get("root").toObject());
        }
    }, {
        /** @lends Y.Plugin.AddImagesWidgetAction */
        NS: "AddImagesWidgetAction",
        NAME: "AddImagesWidgetAction",
        ATTRS: {
            widget: {},
            dataSource: {
                getter: function(val) {
                    if (!val) {
                        return Y.Wegas.Facade.Page;
                    }
                    return val;
                }
            },
            fileDataSource: {
                getter: function(val) {
                    if (!val) {
                        return Y.Wegas.Facade.File;
                    }
                    return val;
                }
            }
        }
    });

    Y.Plugin.AddImagesWidgetAction = AddImagesWidget;
});