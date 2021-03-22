/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add('wegas-sendmail', function(Y) {
    'use strict';
    var Wegas = Y.Wegas,
        CONTENTBOX = "contentBox",
        SendMail = Y.Base.create("wegas-sendmail", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
            BOUNDING_TEMPLATE: '<div class="wegas-sendmail"></div>',
            renderUI: function() {
                var cb = this.get(CONTENTBOX),
                    emailsList = this.get("emails") || "(Hidden list of e-mails)",
                    cfg = {
                        type: "object",
                        properties: {
                            "@class": {
                                type: "string",
                                value: "Email",
                                view: {
                                    type: "hidden"
                                }
                            },
                            "from": {
                                type: "string",
                                value: Y.Wegas.Facade.User.get("currentUser").get("accounts")[0].get("email"),
                                view: {
                                    label: "From",
                                    readOnly: true
                                }
                            },
                            "to": {
                                type: "string",
                                value: Y.Array.map(this.get("players"), function(e) {
                                    return e.toObject();
                                }),
                                view: {
                                    type: "hidden",
                                    readOnly: true
                                }
                            },
                            "dummy": {
                                type: "string",
                                value: emailsList,
                                view: {
                                    readOnly: true,
                                    label: "To"
                                }
                            },
                            "subject": {
                                type: "string",
                                minLength: 1,
                                view: {
                                    label: "Subject"
                                }
                            },
                            "body": {
                                type: "string",
                                minLength: 1,
                                view: {
                                    type: "html",
                                    label: "Body"
                                }
                            }
                        }
                    };

                this.form = new Y.Wegas.RForm({
                    values: {},
                    cfg: cfg,
                    buttons: []
                });
                this.form.render(this.get("contentBox"));

                cb.append('<div><div class="results wegas-advanced-feature"></div><div class="status"></div></div>');
            },
            setStatus: function(status) {
                this.get("contentBox").one(".status").setHTML(status);
            },
            setErrorStatus: function(errorMsg) {
                this.get("contentBox").one(".status").setHTML('<span style="color:red; font-weight:bold">' + errorMsg + '</span>');
            },
            send: function() {
                if (!this.form.validate().length) {
                    this.setErrorStatus("Please complete these fields");
                    var ctx = this;
                    setTimeout(function() {
                        ctx.setStatus("");
                    }, 5000);
                    return;
                }
                this.setStatus("");
                Wegas.Panel.confirm("This will send a real mail", Y.bind(function() {
                    this.setStatus("Sending...");

                    var data = this.form.getValue();
                    if (data.dummy) {
                        // delete data.dummy;
                    }
                    Wegas.Facade.User.sendRequest({
                        request: "/SendMail",
                        cfg: {
                            method: "POST",
                            updateEvent: false,
                            data: data,
                            headers: {
                                "Managed-Mode": true
                            }
                        },
                        on: {
                            success: Y.bind(function() {
                                this.setStatus("OK");
                                Y.later(1000, this, function() {
                                    this.fire("email:sent");
                                });
                            }, this),
                            failure: Y.bind(function(request) {
                                try {
                                    var errorMsg = JSON.parse(request.data.response).events[0].exceptions[0].message;
                                    this.setErrorStatus(errorMsg);
                                } catch (e) {
                                    this.setErrorStatus('Something went wrong');
                                }
                            }, this)
                        }
                    }, this);
                }, this));
            },
            destructor: function() {
                this.form && this.form.destroy();
            }
        },
            {
                ATTRS: {
                    players: {
                        type: "array"
                    },
                    emails: {
                        type: "string"
                    }
                }
            });
    Wegas.SendMail = SendMail;
});
