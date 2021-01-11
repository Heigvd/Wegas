/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

YUI.add('wegas-file-uploader', function(Y) {
    'use strict';

    var FileUploader = Y.Base.create('wegas-file-uploader', Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: ""
            + "<div>"
            + "  <div class='wegas-file-uploader--dropzone-container'>"
            + "    <div class='wegas-file-uploader--dropzone'></div>"
            + "  </div>"
            + "  <div class='wegas-file-uploader--filename'></div>"
            + "  <label class='wegas-file-uploader--input'>"
            + "    <div class='wegas-file-uploader--input-label'></div>"
            + "    <input class='wegas-file-uploader--input-input' style='display: none' type='file' />"
            + "  </label>"
            + "</div>"
        ,
        initializer: function() {
            this.handlers = {};
        },
        destructor: function() {
            for (var k in this.handlers) {
                if (this.handlers.hasOwnProperty(k)) {
                    this.handlers[k] && this.handlers[k].detach();
                }
            }
        },
        renderUI: function() {
            // no op
        },
        bindUI: function() {
            var instance = this.get("shortcutVar.evaluated").getInstance();
            if (instance) {
                this.handlers.onUpdate = Y.Wegas.Facade.Instance.after(
                    instance.get("id") + ':updatedInstance', this.syncUI, this);
            }
            var BB = this.get("boundingBox");
            var CB = this.get("contentBox");
            //this.handlers.onRootDragOver = this.get("root").on("dragover", function(e) {
            //}, this);

            this.get("root").get("boundingBox").on('drop', function(e) {
                e.halt(true);
            });
            //Prevent drop to avoid application exit
            this.get("root").get("boundingBox").on('dragover', function(e) {
//                e._event.dataTransfer.dropEffect = 'none';
                e.halt(true);
            });

            // on drop -> upload
            BB.delegate("drop", function(e) {
                e.preventDefault();
                e.halt(true);
                this.get("boundingBox").removeClass("highlight");
                if (e._event.dataTransfer.files.length) {
                    this.upload(e._event.dataTransfer.files[0]);
                }
                // todo check accept
            }, ".wegas-file-uploader--dropzone", this);

            BB.delegate("dragover", function(e) {
                e.halt(true);
            }, ".wegas-file-uploader--dropzone", this);


            // highlight on hover
            BB.delegate("dragenter", function(e) {
                var bb = this.get("boundingBox");
                bb.addClass("highlight");

                // dataTransfer is not available on dragenter
//                if (e._event.dataTransfer.files.length && !this.isExtensionValid(e._event.dataTransfer.files[0])) {
//                    bb.addClass("invalid-filetype");
//                }
            }, ".wegas-file-uploader--dropzone", this);

            // un highlight
            BB.delegate("dragleave", function(e) {
                var bb = this.get("boundingBox");
                bb.removeClass("highlight");
//                bb.removeClass("invalid-filetype");
            }, ".wegas-file-uploader--dropzone", this);

            CB.delegate("change", function(e) {
                this.upload(e.target.getDOMNode().files[0]);
            }, ".wegas-file-uploader--input-input", this);

            //this.handlers.onSelectFile = CB.delegate("cl");
        },
        isExtensionValid: function(file) {
            var filename = file.name;
            return !!this.get("accept").split(",").find(function(ext) {
                return filename.endsWith(ext.trim());
            });
        },
        getUploadLabel: function() {
            var labelVar = this.get("uploadLabelVar.evaluated");
            if (labelVar) {
                return I18n.tVar(labelVar);
            } else {
                return "upload";
            }
        },
        syncUI: function() {
            var data = this.readLink();
            var theLabel = this.get("contentBox").one(".wegas-file-uploader--input-label");
            var theInput = this.get("contentBox").one(".wegas-file-uploader--input-input");

            theInput.getDOMNode().accept = this.get("accept");

            theLabel.getDOMNode().innerHTML = this.getUploadLabel();

            this._updateLink(data.link);
        },
        _updateLink: function(link) {
            var theLink = this.get("contentBox").one(".wegas-file-uploader--filename");
            theLink.setContent(link);
            //theLink.getDOMNode().setAttribute("data-file", data.filename);
            //theLink.getDOMNode().innerText = data.displayName;
        },
        _addSlashes: function(oPath) {
            var path = oPath || "";
            if (path.length === 0 || path.charAt(0) !== '/') {
                path = "/" + path;
            }
            if (!path.endsWith("/")) {
                path += "/";
            }
            return path;
        },
        /**
         * @returns {String} absolute path of the directory, ending with a slash
         */
        _getPath: function() {
            var path = this._addSlashes(this.get('directory'));
            if (this.get('scope') === 'player') {
                switch (this.get('shortcutVar.evaluated').get('scopeType')) {
                    case 'PlayerScope':
                        path = '.user-uploads/Player-'
                            + Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id") + path;
                        break;
                    case 'TeamScope':
                        path = '.user-uploads/Team-'
                            + Y.Wegas.Facade.Game.cache.getCurrentTeam().get("id") + path;
                        break;
                    case 'GameModelScope':
                        path = '.user-uploads/GameModel-'
                            + Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id")
                            + path;
                        break;
                }
            }
            return this._addSlashes(path);
        },
        _processUpload: function(file) {
            var gmId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id");
            var path = this._getPath();

            // make sure directory exists
            var mkdirUrl = Y.Wegas.Facade.GameModel.get("source") + '/' + gmId + '/File/mkdir' + path;
            fetch(mkdirUrl, {
                credentials: 'same-origin',
                headers: {
                    'Managed-Mode': false,
                    'SocketId': null
                },
                method: 'POST',
            }).then(Y.bind(function(response) {
                if (response.ok) {
                    var url = Y.Wegas.Facade.GameModel.get("source") + '/' + gmId + '/File/upload' + path;
                    var body = new FormData();
                    body.append("name", file.name);
                    body.append("file", file);
                    var link = "<span class='loading' target='_blank'>"
                        + file.name// display name
                        + "</span>";
                    this._updateLink(link);

                    // add a delay to let JCR backend sync up
                    Y.Later(1500, this, function() {
                        // do not use YUI sendRequest due to very strage behaviour regarding file upload
                        fetch(url, {
                            credentials: 'same-origin',
                            headers: {
                                //'Content-Type': // do not define to let system set to multipart with boundaries
                                'Managed-Mode': false,
                                'SocketId': null
                            },
                            method: 'POST',
                            body: body
                        }).then(Y.bind(function(response) {
                            var varName = this.get("shortcutVar.evaluated").get('name');

                            if (response.ok) {
                                var link = '<a target="_blank" data-file=\"'
                                    + path + file.name
                                    + '">'
                                    + file.name// display name
                                    + '</a>';
                                Y.Wegas.Facade.Variable.script.remoteEval(
                                    'Variable.find(gameModel, "' + varName + '")'
                                    + '.setValue(self, ' + JSON.stringify(link) + ');');

                            } else {
                                response.json().then(function(error) {
                                    var content = "Fails to uplaod file";
                                    if (error && error.message) {
                                        content += ": " + error.message;
                                    }
                                    Y.Wegas.Facade.Variable.script.remoteEval(
                                        'Variable.find(gameModel, "' + varName + '")'
                                        + '.setValue(self, ' + JSON.stringify(content) + ');');
                                });
                            }
                        }, this));
                    });
                } else {
                    Y.Wegas.Alerts.showMessage('error', "Fails to uplaod file");
                }
            }, this));
        },
        upload: function(file) {

            if (file) {
                if (this.isExtensionValid(file)) {
                    var currentFile = this.readLink();
                    if (currentFile && currentFile.filename) {
                        // Delete existing file
                        var gmId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id");
                        var url = '/' + gmId + '/File/delete' + currentFile.filename;
                        Y.Wegas.Facade.GameModel.sendRequest({
                            request: url,
                            cfg: {
                                method: 'DELETE'
                            },
                            on: {
                                success: Y.bind(function(_e) {
                                    this._processUpload(file);
                                }, this),
                                failure: Y.bind(function(_e) {
                                    // Error
                                    this._processUpload(file);
                                }, this)
                            }
                        });
                    } else {
                        this._processUpload(file);
                    }
                } else {
                    Y.Wegas.Alerts.showMessage('error', "Invalid file type");
                }
            } else {
                // no-op
            }
        },
        /**
         * read the variable and extract internal and effective name of the file
         * @returns {}
         */
        readLink: function() {
            return FileUploader.readLink(this.get("shortcutVar.evaluated"));
        }
    }, {
        /**
         * read HTML encoded link (<a>...</a>) from a String/Text Descriptor
         *
         * EG: <p><a data-file="/logos/MB_200.png">Pres.pptx</a></p>
         */
        readLink: function(theVar) {
            var ret = {
                variable: theVar,
                displayName: '',
                filename: '',
                link: ''
            };
            if (theVar) {
                // EG: <p><a data-file="/logos/MB_200.png">Pres.pptx</a></p>
                var instance = theVar.getInstance();
                var div = document.createElement("div");
                ret.link = instance.get("value");
                div.innerHTML = ret.link;
                var a = div.getElementsByTagName("a");
                if (a && a[0]) {
                    if (a[0].dataset) {
                        ret.filename = a[0].dataset.file;
                    }
                    if (a[0].innerText) {
                        ret.displayName = a[0].innerText;
                    }
                }
            }
            return ret;
        },
        EDITORNAME: 'Uploader',
        ATTRS: {
            /**
             * string or texat where to store the link of the file.
             * "<a data-file='/{directory}/RANDOM-UNIQUE-NAME'>Effective file name</a>"
             */
            shortcutVar: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Variable',
                    classFilter: ['TextDescriptor']
                }
            },
            accept: {
                type: "string",
                value: "",
                view: {
                    "label": "Accept",
                    "description": "File extension to accept, eg \".jpg, .png\""
                }
            },
            uploadLabelVar: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Upload Button Label',
                    classFilter: [
                        'TextDescriptor',
                        'StaticTextDescriptor',
                        'StringDescriptor'
                    ]
                }
            },
            directory: {
                type: "string",
                view: {
                    "label": "Directory"
                }
            },
            scope: {
                type: "string",
                view: {
                    "label": "Scope",
                    type: "select",
                    choices: ["editor", "player"]
                }
            }
        }
    }
    );
    Y.Wegas.FileUploader = FileUploader;
});
