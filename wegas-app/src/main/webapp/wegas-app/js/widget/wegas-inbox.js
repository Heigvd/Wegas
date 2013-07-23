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
YUI.add('wegas-inbox', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', InboxDisplay;

    /**
     * @name Y.Wegas.InboxDisplay
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class to manage e-mail
     * @constructor
     * @description Display and allow to manage e-mail sent to the current player
     */
    InboxDisplay = Y.Base.create("wegas-inbox", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /**
         * @lends Y.Wegas.InboxDisplay#
         */
        // ** Private fields ** //
        /**
         * TabView widget used to display message header and body
         */
        tabView: null,
        /**
         * Reference to each used functions
         */
        handlers: null,
        /**
         * datasource from Y.Wegas.Facade.VariableDescriptor
         */
        dataSource: null,
        /**
         * Button widget used to delete e-mail
         */
        deleteButton: null,
        /**
         * Current selected message in tabview;
         */
        msg: null,
        /**
         *
         */
        readRequestTid: null,
        /**
         * JS translator
         */
        jsTranslator: null,
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         * Plug a toolbar widget (and add the delete button at this toolbar).
         */
        initializer: function() {
            this.dataSource = Y.Wegas.Facade.VariableDescriptor;
            this.handlers = {};
            this.jsTranslator = new Y.Wegas.JSTranslator();
            this.plug(Y.Plugin.WidgetToolbar);
            this.deleteButton = new Y.Wegas.Button({
                label: "<span class='wegas-icon wegas-icon-cancel'></span>"+this.jsTranslator.getRB().Delete
            });
            this.toolbar.add(this.deleteButton);
            this.tabView = new Y.TabView();
        },
        /**
         * @function
         * @private
         * @description Render the TabView widget in the content box.
         */
        renderUI: function() {
            this.tabView.render(this.get(CONTENTBOX));
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When selection change on tabView, call function "onTabSelected"
         * When dataSource is updated, do syncUI
         * When deleteButton is clicked, show an alert which allow to delete selected message
         */
        bindUI: function() {
            this.tabView.after("selectionChange", this.onTabSelected, this);
            this.handlers.dataUpdated = this.dataSource.after("update", function (e) {
                if (e.tId !== this.readRequestTid) {
                    this.syncUI();
                }
            }, this);
            this.handlers.deleteEMail = this.deleteButton.on("click", function(e) {
                if (!this.msg) {
                    return;
                }
                if (confirm('The e-mail "' + this.msg.get("subject") + '" will be deleted permanently. Continue ?')) {
                    this.deleteEmail();
                }
            }, this);
        },
        /**
         * @function
         * @private
         * @description Clear and re-fill th TabView with current player message.
         * display a message if there is no message.
         * Re-select the current selected msg;
         */
        syncUI: function() {
            var i, msg, tab, from, indexCounter = 0,
                    inboxDescriptor = this.get('variable.evaluated'),
                    inboxVariable, messages,
                    selectedIndex = 0,
                    tabs = [];
            if (!inboxDescriptor) {
                this.tabView.add({
                    label: '',
                    content: '<center>Unable to find inbox variable</center>'
                });
                return;
            }
            inboxVariable = inboxDescriptor.getInstance();
            messages = inboxVariable.get("messages");

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
                            + '<div class="msg-body"><center><em><i>Loading</i></em></center></div>'
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
        /**
         * @function
         * @private
         * @description Destroy TabView and all functions created by this widget
         */
        destructor: function() {
            this.tabView.destroy();
            this.handlers.dataUpdated.detach();
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         * @description Send a REST request to delete selected message
         */
        deleteEmail: function(e) {
            if (!this.msg) {
                return;
            }
            this.dataSource.sendRequest({
                request: "/Inbox/Message/" + this.msg.get("id"),
                cfg: {
                    method: "DELETE"
                },
                on: {
                    success: this.msg = null
                }
            });
        },
        /**
         * @function
         * @private
         * @description retrieve selected message's body and set this as "read" if
         * tab has been selected longer than 2000 miliseconde.
         */
        onTabSelected: function(e) {
            var i, attachement, attachements = [];
            if (this.isSyncing) {
                return;
            }

            if (this.timer) {                                                   // If there is an active unread
                this.timer.cancel();                                            // message timer, we cancel it.
            }

            if (e.newVal && e.newVal.msg) {
                this.dataSource.sendRequest({// Retrieve the message body from the server
                    request: "/Inbox/Message/" + e.newVal.msg.get("id") + "?view=Extended",
                    cfg: {
                        updateCache: false
                    },
                    on: {
                        success: Y.bind(function(e) {
                            if (e.response.entity.get("attachements") && e.response.entity.get("attachements").length > 0) {
                                for (i = 0; i < e.response.entity.get("attachements").length; i += 1) {
                                    attachement = e.response.entity.get("attachements")[i];
                                    attachements.push("<a href='" + attachement + "' data-file='" + attachement + "'>"
                                            + attachement + "</a>");
                                }
                                if (!this.get("panelNode").one(".msg-header .msg-attachement")) {
                                    this.get("panelNode").one(".msg-header").append("<div class='msg-attachement'></div>");
                                }
                                this.get("panelNode").one(".msg-header .msg-attachement")
                                        .setHTML("Attachements: " + attachements.join("; "));
                            }
                            this.get("panelNode").one(".msg-body")
                                    .setHTML(e.response.entity.get("body") || "<center><em><i>Empty</i></center>");
                        }, e.newVal)
                    }
                });
                this.msg = e.newVal.msg;

                if (e.newVal.msg.get("unread")) {                               // If the message is currently unread,
                    this.timer = Y.later(50, this, function(msg, tab) {            // Send a request to mark it as read
                        Y.log("Sending message read update", "info", "InboxDisplay");
                        msg.set("unread", false);
                        this.readRequestTid = this.dataSource.sendRequest({
                            request: "/Inbox/Message/Read/" + msg.get("id"),
                            cfg: {
                                method: "PUT"
                            },
                            on: {
                                success: Y.bind(function(tab) {
                                    tab.get("contentBox").one(".unread").removeClass("unread").addClass("read");
                                }, this, tab)
                            }
                        });
                    }, [e.newVal.msg, e.newVal]);
                }
            }
        }

    }, {
        /**
         * @lends Y.Wegas.InboxDisplay
         */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>variable: The target variable, returned either based on the name
         *     attribute, and if absent by evaluating the expr attribute.</li>
         * </ul>
         */
        ATTRS: {
            /**
             * The target variable, returned either based on the name
             * attribute, and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: ["InboxDescriptor"]
                }
            }
        }
    });
    Y.namespace('Wegas').InboxDisplay = InboxDisplay;

});
