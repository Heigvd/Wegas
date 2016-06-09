/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
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
        inputEx = Y.inputEx,
        SendMail = Y.Base.create("wegas-sendmail", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
            BOUNDING_TEMPLATE: '<div class="wegas-form"></div>',
            renderUI: function() {
                var cb = this.get(CONTENTBOX),
                    emailsList = this.get("emails") || "(Hidden list of e-mails)",
                    cfg = {
                        type: "group",
                        parentEl: cb,
                        fields: [
                            {
                                name: "@class",
                                type: "hidden",
                                value: "Email"
                            },
                            {
                                name: "from",
                                label: "From",
                                type: "uneditable",
                                value: Y.Wegas.Facade.User.get("currentUser").get("accounts")[0].get("email")
                            },
                            {
                                name: "to",
                                label: "To",
                                type: "hidden",
                                value: Y.Array.map(this.get("players"), function(e) {
                                    return e.toObject();
                                })
                            },
                            {
                                name: "dummy",
                                label: "To",
                                type: "uneditable",
                                value: emailsList
                            },
                            {
                                type: "string",
                                name: "subject",
                                label: "Subject",
                                required: true
                            }, {
                                type: "html",
                                name: "body",
                                label: "Body",
                                required: true
                            }
                        ]
                    };
                inputEx.use(cfg, Y.bind(function() {
                    this._form = new inputEx(cfg);
                }, this));
                cb.append('<div><div class="results wegas-advanced-feature"></div><div class="status"></div></div>');
            },
            setStatus: function(status) {
                this.get("contentBox").one(".status").set("text", status);
            },
            send: function() {
                if (!this.validate()) {
                    this.setStatus("Some fields are invalid");
                    return;
                }

                Wegas.Panel.confirm("This will send a real mail", Y.bind(function() {
                    this.setStatus("Sending...");

                    var form = this._form.getValue();
                    if (form.dummy) {
                        delete form.dummy;
                    }
                    Wegas.Facade.User.sendRequest({
                        request: "/SendMail",
                        cfg: {
                            method: "POST",
                            updateEvent: false,
                            data: form
                        },
                        on: {
                            success: Y.bind(function() {
                                this.setStatus("OK");
                                Y.later(1000, this, function() {
                                    this.fire("email:sent");
                                });
                            }, this),
                            failure: Y.bind(function() {
                                this.setStatus("Something went wrong");
                            }, this)
                        }
                    }, this);
                }, this));
            },
            validate: function() {
                var inputs = this._form.inputs, i, valid = true;
                for (i = 0; i < inputs.length; i += 1) {
                    valid = valid && inputs[i].validate();
                }
                return valid;
            },
            destructor: function() {
                this._form.destroy();
                this._form = null;
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
