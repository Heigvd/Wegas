/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-inbox', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', InboxDisplay;

    InboxDisplay = Y.Base.create("wegas-inbox", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        // *** Private Fields *** //
        tabView: null,
        handlers: null,
        dataSource: null,
        deleteButton: null,
        msg: null,
        // *** Lifecycle Methods *** //
        initializer: function () {
            this.dataSource = Y.Wegas.app.VariableDescriptorFacade;
            this.handlers = {};
            this.plug(Y.Plugin.WidgetToolbar);
        },
        renderUI: function () {
            this.deleteButton = new Y.Wegas.Button({
                label: "<span class='wegas-icon wegas-icon-cancel'></span>Delete"
            });
            this.toolbar.add(this.deleteButton);
            this.tabView = new Y.TabView();
            this.tabView.render(this.get(CONTENTBOX));
        },
        bindUI: function () {
            this.tabView.after("selectionChange", this.onTabSelected, this);
            this.handlers.dataUpdated = this.dataSource.after("update", this.syncUI, this);
            this.handlers.deleteEMail = this.deleteButton.on("click", function (e) {
                if(!this.msg) {
                    return;
                }
                if (confirm('The e-mail "' + this.msg.get("subject") + '" will be deleted permanently. Continue ?')) {
                    this.deleteEmail();
                }
            }, this);
        },
        syncUI: function () {
            var i, msg, tab, from, indexCounter = 0,
                    inboxVariable = this.get('variable.evaluated').getInstance(),
                    messages = inboxVariable.get("messages"),
                    selectedIndex = 0,
                    tabs = [];

            this.isSyncing = true;
            this.tabView.removeAll();
            for (i = messages.length - 1; i >= 0; i -= 1) {
                msg = messages[i];
                from = msg.get("from") || "<i>No sender</i>";
                tab = new Y.Tab({
                    label: '<div class="' + (msg.get("unread") ? "unread" : "read") + '"><div class="left">' + from + '</div>'
                            + '<div class="right">' + msg.get("subject") + '</div></div>',
                    content: '<div class="msg-header">'
                            + '<div class="msg-subject">Subject: ' + msg.get("subject") + '</div>'
                            + '<div class="msg-from">From: ' + from + '</div>'
                            + '</div>'
                            + '<div class="msg-body"><center><em><i>Loading</i></center></div>'
                });
                tab.msg = msg;
                tabs.push(tab);

                if (this.msg && this.msg.get("id") === msg.get("id")) {
                    selectedIndex = indexCounter;
                }
                indexCounter += 1;
            }
            this.tabView.add(tabs);

            if (messages.length === 0) {
                this.tabView.add({
                    label: '',
                    content: '<center><i>You have no messages</i></center>'
                });
            }

            this.isSyncing = false;
            this.tabView.selectChild(selectedIndex);
        },
        destructor: function () {
            this.tabView.destroy();
            this.handlers.dataUpdated.detach();
        },
        // *** Private Methods *** //
        deleteEmail: function (e) {
            if (!this.msg) {
                return;
            }
            this.dataSource.rest.sendRequest({
                request: "/Inbox/Message/" + this.msg.get("id"),
                cfg: {
                    method: "DELETE"
                },
                on: {
                    success: this.msg = null
                }
            });
        },
        onTabSelected: function (e) {
            var i, attachement, attachements = [];
            if (this.isSyncing) {
                return;
            }

            if (this.timer) {                                                   // If there is an active unread
                this.timer.cancel();                                            // message timer, we cancel it.
            }

            if (e.newVal && e.newVal.msg) {

                this.dataSource.rest.sendRequest({// Retrieve the message body from the server
                    request: "/Inbox/Message/" + e.newVal.msg.get("id") + "?view=Export",
                    on: {
                        success: Y.bind(function (e) {
                            if (e.response.entity.get("attachements") && e.response.entity.get("attachements").length > 0) {
                                for (i = 0; i < e.response.entity.get("attachements").length; i++) {
                                    attachement = e.response.entity.get("attachements")[i];
                                    attachements.push("<a href='" + attachement + "' data-file='" + attachement + "'>" + attachement + "</a>");
                                }
                                if (!this.get("panelNode").one(".msg-header .msg-attachement")) {
                                    this.get("panelNode").one(".msg-header").append("<div class='msg-attachement'></div>");
                                }
                                this.get("panelNode").one(".msg-header .msg-attachement").setHTML("Attachements: " + attachements.join("; "));
                            }
                            this.get("panelNode").one(".msg-body").setHTML(e.response.entity.get("body") || "<center><em><i>Empty</i></center>");
                        }, e.newVal)
                    }
                });
                this.msg = e.newVal.msg;

                if (e.newVal.msg.get("unread")) {                               // If the message is currently unread,
                    this.timer = Y.later(2000, this, function () {              // Send a request to mark it as read
                        Y.log("Sending message read update", "info", "InboxDisplay");
                        this.msg.set("unread", false);
                        this.dataSource.rest.sendRequest({
                            request: "/Inbox/Message/Read/" + this.msg.get("id"),
                            cfg: {
                                method: "PUT"
                            }
                        });
                    });
                }
            }
        }

    }, {
        ATTRS: {
            /**
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable"
                }
            }
        }
    });

    Y.namespace('Wegas').InboxDisplay = InboxDisplay;
});