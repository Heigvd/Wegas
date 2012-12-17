/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
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
        dataSource: null,

        // *** Lifecycle Methods *** //
        initializer: function () {
            this.dataSource = Y.Wegas.app.VariableDescriptorFacade;
            this.handlers = {};
            this.plug(Y.Plugin.WidgetToolbar);
        },

        renderUI: function () {
            this.tabView = new Y.TabView();
            this.tabView.render(this.get(CONTENTBOX));
        },

        bindUI: function () {
            this.tabView.after("selectionChange", this.onTabSelected, this);
            this.handlers.dataUpdated = this.dataSource.after("update", this.syncUI, this);
        },

        syncUI: function () {
            var i, msg, tab, from,
            inboxVariable = this.get('variable.evaluated').getInstance(),
            messages = inboxVariable.get("messages"),
            selectedIndex = 0,
            tabs = [];

            this.isSyncing = true;
            this.tabView.removeAll();
            for (i = messages.length - 1; i >= 0; i -= 1) {
                msg = messages[i];
                from  = msg.get("from") || "<i>No sender</i>";
                tab = new Y.Tab({
                    label: '<div class="' + (msg.get("unread") ? "unread" : "read") + '"><div class="left">' + from + '</div>'
                    + '<div class="right">' + msg.get("subject") + '</div></div>',
                    content: '<div class="msg-subject">Subject: ' + msg.get("subject") + '</div>'
                    + '<div class="msg-from">From: ' + from + '</div>'
                    + '<div class="msg-body"><center><em><i>Loading</i></center></div>'
                });
                tab.msg = msg;
                tabs.push(tab);

                if (this.msg && msg.id === this.msg.id) {
                    selectedIndex = i;
                }
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
        onTabSelected: function (e) {
            if (this.isSyncing) {
                return;
            }

            if (this.timer) {                                                   // If there is an active unread
                this.timer.cancel();                                            // message timer, we cancel it.
            }

            if (e.newVal && e.newVal.msg) {

                this.dataSource.rest.sendRequest({                              // Retrieve the message body from the server
                    request: "/Inbox/Message/" + e.newVal.msg.get("id") + "?view=Export",
                    on: {
                        success: Y.bind(function (e) {
                            this.get("panelNode").one(".msg-body").setHTML(e.response.entity.get("body") || "<center><em><i>Empty</i></center>");
                        }, e.newVal)
                    }
                });
                this.msg = e.newVal.msg;

                if (e.newVal.msg.get("unread")) {                               // If the message is currently unread,
                    this.timer = Y.later(2000, this, function () {              // Send a request to mark it as read
                        Y.log("Sending message read update", "info",  "InboxDisplay");
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
        ATTRS : {
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