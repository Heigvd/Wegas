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

    var Wegas = Y.Wegas;

    /**
     * @name Y.Wegas.UploadFileButton
     * @extends Y.Wegas.Widget
     * @class 
     * @constructor
     */
    Wegas.UploadFileButton = Y.Base.create("uploadfile", Y.Widget, [Wegas.Editable, Wegas.Widget], {
        /** @lends Y.Wegas.UploadFileButton# */
        /**
         * @function
         * @private
         */
        renderUI: function() {
            var uploader = new Y.UploaderHTML5({
                fileFieldName: "file",
                selectButtonLabel: this.get("label"),
                appendNewFiles: false,
                multipleFiles: false,
                uploadURL: Wegas.app.get("base") + "rest/GameModel/",
                withCredentials: false
            }).render(this.get("contentBox"));

            this.get("contentBox").one("button").setStyles({
                width: "auto",
                height: "auto"
            });

            uploader.on("fileselect", function() {
                this.showOverlay();
                uploader.uploadAll();
            }, this);
            uploader.on("alluploadscomplete", function() {
                this.hideOverlay();
                this.showMessageBis("success", "Game imported");
            }, this);
            uploader.on("uploaderror", function() {
                this.hideOverlay();
                this.showMessageBis("error", "Error uploading json file");
            }, this);
        }
    }, {
        ATTRS: {
            label: {
                value: "Upload"
            }
        }
    });


    /**
     * @name Y.Wegas.UploadFileButton
     * @extends Y.Wegas.Widget
     * @class 
     * @constructor
     */
    Wegas.GameModelHistory = Y.Base.create("history", Y.Widget, [Wegas.Editable, Wegas.Widget], {
        /** @lends Y.Wegas.UploadFileButton# */
        /**
         * @function
         * @private
         */
        renderUI: function() {
            var gm = this.get("entity");
            Wegas.Facade.GameModel.sendRequest({
                request: gm.get("id") + "/File/list/VERSIONS",
                cfg: {
                    updateCache: false
                },
                on: {
                    success: function(e) {
                        console.log(e);
                    }
                }
            });
        }
    }, {
        ATTRS: {
            entity: {}
        }
    });
});
