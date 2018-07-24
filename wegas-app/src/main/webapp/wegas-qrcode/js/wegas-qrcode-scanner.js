/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2018 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/* global Instascan */

YUI.add('wegas-qrcode-scanner', function(Y) {
    "use strict";

    var QrCodeScanner,
        CONTENTBOX = "contentBox";

    /**
     *  The QR-code scanner class.
     */
    QrCodeScanner = Y.Base.create("wegas-qrcode-scanner", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild, Y.Wegas.Editable], {
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.cameras = {};
            this.mirror = this.get("mirror");
            Instascan.Camera.getCameras();
        },
        renderUI: function() { // Create all DOM elements
            this.get("contentBox").setContent("v5: <i class='fa fa-4x fa-qrcode initiator'> </i>");

            this.get("contentBox").append("<div class='the_scanner'>"
                + "  <i class='mirror fa fa-4x fa-arrows-h'></i>"
                + "  <ul class='cameras'></ul>"
                + "  <div class='preview-container'>"
                + "    <video muted autoplay playsinline class='scanner'></video>"
                + "  </div>"
                + "</div>");
        },
        bindUI: function() {
            this.get("contentBox").delegate("click", this.toggleScanner, ".initiator", this);
            this.get("contentBox").delegate("click", this.flip, ".mirror", this);
            this.get("contentBox").delegate("click", this.changeCamera, ".cameras li", this);
        },
        changeCamera: function(e) {
            this.startScanner(e.target.getData("cameraId"));
        },
        startScanner: function(cameraId) {
            if (this.scanner && this.currentCameraId !== cameraId) {
                this.scanner.start(this.cameras[cameraId]);
                this.currentCameraId = cameraId;
            }
        },
        stopScanner: function() {
            if (this.scanner) {
                this.scanner.stop();
            }
            this.currentCameraId = null;
        },
        flip: function() {
            this.mirror = !this.mirror;
            if (this.scanner) {
                this.scanner.stop();

                var scanner = new Instascan.Scanner({
                    video: this.get("contentBox").one(".scanner").getDOMNode(),
                    mirror: this.mirror,
                    scanPeriod: 5
                });

                scanner.addListener('scan', Y.bind(this.process, this));

                scanner.start(this.cameras[this.currentCameraId]);
                this.scanner = scanner;
            }
        },
        toggleScanner: function() {
            console.log("StartScanning");
            var cb = this.get("contentBox");
            if (!this.scanner) {
                var scanner = new Instascan.Scanner({
                    video: cb.one(".scanner").getDOMNode(),
                    mirror: this.mirror,
                    scanPeriod: 5
                });

                scanner.addListener('scan', Y.bind(this.process, this));

                Instascan.Camera.getCameras().then(Y.bind(function(cameras) {
                    if (cameras.length > 0) {
                        var list = cb.one(".cameras");
                        list.setContent();
                        for (var i in cameras) {
                            this.cameras[cameras[i].id] = cameras[i];
                            list.append("<li class='camera' data-cameraId=" + cameras[i].id + ">" + cameras[i].name + cameras[i].id + "</li>");
                        }

                        this.scanner = scanner;
                        this.startScanner(cameras[0].id);
                    } else {
                        this.showMessage("NOCAMERA");
                        console.error('No cameras found.');
                    }
                }, this)).catch(Y.bind(function(e) {
                    this.showMessage("error", " => " + e);
                    console.error(e);
                }, this));

                cb.toggleClass("scanning", true);

            } else {
                //cb.one(".the_scanner") && cb.one(".the_scanner").remove();
                this.stopScanner();
                this.scanner = null;
                cb.toggleClass("scanning", false);
            }
        },

        toggleScanner_qrScanner: function() {
            var cb = this.get("contentBox");
            if (!this.scanner) {
                var scanner = new QrScanner(cb.one(".scanner").getDOMNode(), Y.bind(this.process, this));
                this.scanner = scanner;
                this.scanner.start();
                cb.toggleClass("scanning", true);
            } else {
                cb.one("video").remove();
                this.scanner.stop();
                this.scanner = null;
                cb.toggleClass("scanning", false);
            }
        },

        syncUI: function() {
            var cb = this.get(CONTENTBOX);
        },
        process: function(qrCodeValue) {
            var o = JSON.parse(qrCodeValue);
            if (o && o.type) {
                var type = o.type;
                var payload = o.payload;
                switch (type) {
                    case "runJs":
                        this.showOverlay();
                        Y.Wegas.Facade.Variable.script.remoteEval(
                            {
                                "@class": "Script",
                                content: payload
                            },
                            {
                                on: {
                                    success: Y.bind(this.hideOverlay, this),
                                    failure: Y.bind(this.hideOverlay, this)
                                }
                            }
                        );

                        break;
                    case "selectChoice":
                        /* payload={
                         choiceName : "choiceName"
                         }
                         */
                        var choice = Y.Wegas.Facade.Variable.cache.find("name", payload.choiceName);
                        Y.Wegas.Facade.Variable.sendRequest({
                            request: "/QuestionDescriptor/SelectChoice/" + choice.get('id')
                                + "/Player/" + Y.Wegas.Facade.Game.get('currentPlayerId')
                                + "/StartTime/0",
                            cfg: {
                                method: "GET" // initially: POST
                            }
                        });
                        break;
                    case "cancelChoice":
                        var replies = Y.Wegas.Facade.Variable.cache.find("name", payload.choiceName).getInstance().get("replies");
                        if (replies && replies.length) {
                            // TODO reply = first 
                            Y.Wegas.Facade.Variable.sendRequest({
                                request: "/QuestionDescriptor/CancelReply/" + replies[0].get('id')
                                    + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                                cfg: {
                                    method: "GET"
                                }
                            });
                        }
                        break;
                    case "selectValidateChoice":
                        var choice = Y.Wegas.Facade.Variable.cache.find("name", payload.choiceName);
                        Y.Wegas.Facade.Variable.sendRequest({
                            request: "/QuestionDescriptor/SelectAndValidateChoice/"
                                + choice.get('id') + "/Player/"
                                + Y.Wegas.Facade.Game.get('currentPlayerId'),
                            cfg: {
                                method: "POST"
                            }
                        });
                        break;
                    case "validateQuestion":
                        break;
                    case "openPage":
                        /*
                         payload = {
                         pageId: 123,
                         pageDisplayId :  || 'maindisplayarea'
                         }
                         */
                        break;
                }

                this.toggleScanner();
            } else {
                Y.log("unknown code");
            }
        },
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        generateRunScript: function(node, content) {
            return new QRCode(node, {
                text: JSON.stringify({
                    type: "runJs",
                    payload: content.get ? content.get("content") : content.content
                })
            });
        },
        updateRunScript: function(qrCode, content) {
            qrCode.clear();
            qrCode.makeCode(JSON.stringify({
                type: "runJs",
                payload: content.get ? content.get("content") : content.content
            }));
        },
        generateSelectAndValidateChoice: function(node, choice) {
            return new QRCode(node, {
                text: JSON.stringify({
                    type: "selectValidateChoice",
                    payload: choice.get("name")
                })
            });
        },
        updateSelectAndValidateChoice: function(qrCode, choice) {
            qrCode.clear();
            qrCode.makeCode(JSON.stringify({
                type: "selectValidateChoice",
                payload: choice.get("name")
            }));
        },
        ATTRS: {
            mirror: {
                type: "boolean",
                value: false,
                view: {
                    label: "Mirror"
                }
            }
        }
    });

    Y.Wegas.QrCodeScanner = QrCodeScanner;

});