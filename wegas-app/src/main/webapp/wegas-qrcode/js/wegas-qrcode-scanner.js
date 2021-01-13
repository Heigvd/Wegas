/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2018 School of Management and Engineering Vaud, Comem
 * Licensed under the MIT License
 *
 * NB: as of August 2018, Instascan needs this patch for iOS:
 * https://github.com/centogram/instascan
 *
 * When a camera access rights issue is detected, the client game can display help instructions inside a text box
 * following this widget. That box will then appear as this widget receives the additional class "error". Sample CSS:
 *     .wegas-qrcode-scanner.error ~ .qrcode-help-box {
 *         display: block;
 *     }
 *
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
            this.autostart = this.get("autostart");
        },
        renderUI: function() { // Create all DOM elements
            var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
                // Instascan bugfix from https://github.com/schmich/instascan/pull/112 :
                videoAttrs = iOS ? "muted autoplay playsinline" : "muted playsinline";
            this.get(CONTENTBOX).setContent("<button class='fa fa-qrcode initiator'><span class='fa-button-label'>" +
                I18n.t("qrcode.startScan") + "</span></button>");
            this.get(CONTENTBOX).append("<div class='the_scanner'>"
                + "  <button class='mirror fa fa-arrows-h'><span class='fa-button-label'>" +
                I18n.t("qrcode.mirror") + "</span></button>"
                + "  <div class='cameras'></div>"
                + "  <div class='preview-container'>"
                + "    <video class='scanner' " + videoAttrs + "></video>"
                + "  </div>"
                + "</div>");
        },
        syncUI: function() {
            if (this.autostart) {
                this.toggleScanner();
            }
        },
        bindUI: function() {
            this.get(CONTENTBOX).delegate("click", this.toggleScanner, ".initiator", this);
            this.get(CONTENTBOX).delegate("click", this.flip, ".mirror", this);
            this.get(CONTENTBOX).delegate("click", this.changeCamera, ".cameras .camera", this);
        },
        changeCamera: function(e) {
            this.startScanner(e.target.getData("cameraId"));
        },
        startScanner: function(cameraId) {
            if (this.scanner && this.currentCameraId !== cameraId) {
                this.scanner.start(this.cameras[cameraId]);
                this.currentCameraId = cameraId;
                var cb = this.get(CONTENTBOX);
                cb.one(".initiator .fa-button-label").setContent(I18n.t("qrcode.cancelScan"));
                cb.all(".camera").addClass("inactive");
                var me = cb.one('.camera[data-cameraId = "' + cameraId + '"]');
                me && me.removeClass("inactive");
            }
        },
        stopScanner: function() {
            if (this.scanner) {
                this.scanner.stop();
            }
            this.currentCameraId = null;
            var cb = this.get(CONTENTBOX);
            cb.one(".initiator .fa-button-label").setContent(I18n.t("qrcode.startScan"));
        },
        flip: function() {
            this.mirror = !this.mirror;
            if (this.scanner) {
                this.scanner.stop();

                var scanner = new Instascan.Scanner({
                    video: this.get(CONTENTBOX).one(".scanner").getDOMNode(),
                    mirror: this.mirror,
                    scanPeriod: 5
                });

                scanner.addListener('scan', Y.bind(this.process, this));

                scanner.start(this.cameras[this.currentCameraId]);
                this.scanner = scanner;
            }
        },
        toggleScanner: function() {
            Y.log("ToggleScanner");
            var cb = this.get(CONTENTBOX),
                bb = this.get("boundingBox"),
                // Enable game-specific help box for solving access rights issues:
                pt = cb.get("parentNode");
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
                            list.append("<button class='camera fa fa-camera' data-cameraId=" + cameras[i].id +
                                "><span class='fa-button-label' data-cameraId=" + cameras[i].id + ">" +
                                cameras[i].name + "</span></button>");
                        }

                        pt.removeClass("error");
                        cb.addClass("scanning");
                        bb.addClass("bb-scanning");
                        this.scanner = scanner;
                        this.startScanner(cameras[0].id);
                    } else {
                        this.showMessage("error", I18n.t("qrcode.noCamera"));
                        cb.removeClass("scanning");
                        bb.removeClass("bb-scanning");
                        pt.addClass("error");
                    }
                }, this)).catch(Y.bind(function(e) {
                    this.showMessage("error", I18n.t("qrcode.accessRights") + "<div class='error-details'>(" + e + ")</div>");
                    bb.removeClass("bb-scanning");
                    cb.removeClass("scanning");
                    pt.addClass("error");
                }, this));


            } else {
                //cb.one(".the_scanner") && cb.one(".the_scanner").remove();
                this.stopScanner();
                this.scanner = null;
                cb.removeClass("error");
                bb.removeClass("bb-scanning");
                cb.removeClass("scanning");
            }
        },

        toggleScanner_qrScanner: function() {
            var cb = this.get(CONTENTBOX);
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
                                    failure:
                                        // The QR-code seems to be encoded properly for Wegas, but did generate an error:
                                        Y.bind(function(e) {
                                            this.hideOverlay();
                                            // Hide any low-level error panel:
                                            var panel = Y.one(".wegas-panel"),
                                                ok = panel && panel.one(".yui3-button");
                                            if (ok) {
                                                YUI().use('node-event-simulate', function(Y) {
                                                    ok.simulate("click");
                                                });
                                            }
                                            this.showMessage("error", I18n.t("qrcode.notUnderstood"));
                                            Y.log("*** " + I18n.t("qrcode.notUnderstood"));
                                            Y.log(" Decoded QR-code: " + qrCodeValue);
                                        }, this)
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
                // The QR-code was apparently not encoded for Wegas :
                this.showMessage("error", I18n.t("qrcode.notUnderstood"));
                Y.log("*** " + I18n.t("qrcode.notUnderstood"));
                Y.log(" Decoded QR-code: " + qrCodeValue);
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
            },
            autostart: {
                type: "boolean",
                value: false,
                view: {
                    label: "Autostart"
                }
            }
        }
    });

    Y.Wegas.QrCodeScanner = QrCodeScanner;

});
