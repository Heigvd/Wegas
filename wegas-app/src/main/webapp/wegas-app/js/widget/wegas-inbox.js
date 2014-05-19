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

    var CONTENTBOX = 'contentBox',
            InboxDisplay,
            /**
             * define tab and content Templates, add new ones :
             * TEMPLATES:{TEMPLATE_NAME:{tab:'template', content:'template'}}
             *
             * specify the one to use in "template" ATTRS
             * !!COMPILED!! Template may be added after initialization in
             * Y.Wegas.InboxDisplay.prototype.TEMPLATES['name'] =
             * {tab: Y.Template.Micro.compile(tab_text_template),
             * content: Y.Template.Micro.compile(content_text_template)}
             */
            TEMPLATES = {
                inbox: {
                    tab: "<div class=' <%=(this.get('unread') ? 'unread' : 'read')%>'><div class='left'><%= this.get('from') || '<i>No sender</i>' %> </div><div class='right'><%=this.get('subject')%></div></div>",
                    content: "<div class='msg-header'><div class='msg-subject'>Subject: <%=this.get('subject')%></div><div class='msg-from'>From: <%= this.get('from') || '<i>No sender</i>' %></div><div class='msg-attachement'><%= (this.get('attachements') && this.get('attachements').length) ? 'Attachments: ':'' %> <% Y.Array.each(this.get('attachements'), function(a){ %><a href='<%= a %>' data-file='<%= a %>' target='_blank'><%= a.split('/').pop() %></a>;<% }); %></div></div><div class='msg-body'><%== this.get('body') %></div>"
                },
                /**
                 * inbox without labels.
                 */
                clean: {
                    tab: "<div class=' <%=(this.get('unread') ? 'unread' : 'read')%>'><div class='left'><%= this.get('from') || '<i>No sender</i>' %> </div><div class='right'><%=this.get('subject')%></div></div>",
                    content: "<div class='msg-header'><div class='msg-subject'><%=this.get('subject')%></div><div class='msg-from'><%= this.get('from') || '<i>No sender</i>' %></div><div class='msg-attachement'><% Y.Array.each(this.get('attachements'), function(a){ %><a href='<%= a %>' data-file='<%= a %>'  target='_blank'><%= a.split('/').pop() %></a>;<% }); %></div></div><div class='msg-body'><%== this.get('body') %></div>"
                }
            };
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
         *
         */
        readRequestTid: null,
        /**
         * Holds compiled templates. Add templates in scope variable TEMPLATES
         */
        TEMPLATES: (function() {
            var i, j, ret = {};
            for (i in TEMPLATES) {
                if (TEMPLATES.hasOwnProperty(i)) {
                    ret[i] = {};
                    for (j in TEMPLATES[i]) {
                        if (TEMPLATES[i].hasOwnProperty(j)) {
                            ret[i][j] = Y.Template.Micro.compile(TEMPLATES[i][j]);
                        }
                    }
                }
            }
            return ret;
        }()),
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
        },
        /**
         * @function
         * @private
         * @description Render the TabView widget in the content box.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    delBtn;
            this.tabView = new Y.TabView();                                     // TabView widget used to display messages
            this.tabView.render(cb);                                            // and render it
            this.tabView.get("boundingBox").addClass("horizontal-tabview");     // Add class to have horizontal tabview
            cb.append("<div style='clear:both'></div>");
            if (this.toolbar) {
                delBtn = new Y.Wegas.Button({
                    label: "<span class='wegas-icon wegas-icon-cancel'></span>" + this.jsTranslator.getRB().Delete
                });                                                             // Create delete mail button
                delBtn.on("click", function() {                                 // On delete button click
                    var selection = this.tabView.get("selection");
                    if (selection && !selection.msg                             // If a valid mail tab is selected
                            && confirm('The e-mail "' + selection.msg.get("subject") + '" will be deleted permanently. Continue?')) { // and user is sure
                        this.deleteEmail(selection.msg);                        // destroy the message
                    }
                }, this);
                this.toolbar.add(delBtn);
            }
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
            this.handlers.dataUpdated = this.dataSource.after("update", function(e) {
                if (e.tId !== this.readRequestTid) {
                    this.syncUI();
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
            var inboxDescriptor = this.get('variable.evaluated');
            if (!inboxDescriptor) {
                this.tabView.add({
                    label: '',
                    content: '<center>Unable to find inbox variable</center>'
                });
                return;
            }
            Y.Wegas.Facade.VariableDescriptor.cache.getWithView(inboxDescriptor.getInstance(), "Extended", {
                on: {
                    success: Y.bind(function(e) {
                        this.updateTabView(e.response.entity.get("messages"));
                    }, this)
                }
            });
        },
        /**
         * @function
         * @private
         * @description Destroy TabView and all eventHandlers created by this widget
         */
        destructor: function() {
            this.tabView.destroy();
            this.handlers.dataUpdated.detach();
        },
        // *** Private Methods *** //
        /**
         * Update tabView. Tab part.
         * @private
         * @param {Array of entity} entities
         * @returns {undefined}
         */
        updateTabView: function(entities) {
            var selection = this.tabView.get("selection"),
                    oldMsg = selection && selection.msg;
            this.isDestroying = true;
            this.tabView.destroyAll();
            this.isDestroying = false;
            if (entities.length === 0) {
                this.tabView.add(new Y.Tab({
                    label: '',
                    content: '<center><i>You have no messages</i></center>'
                }));
            }
            Y.Array.each(entities, function(entity) {
                var tab = new Y.Tab({
                    label: this.TEMPLATES[this.get("template")].tab(entity),
                    content: "<div class=\"wegas-loading-div\"><div>"
                });
                this.tabView.add(tab);
                tab.msg = entity;
                if (oldMsg && oldMsg.get("id") === entity.get("id")) {          // If the current tab was selected before sync,
                    tab.set("selected", 2);
                }
            }, this);
            if (!this.tabView.get("selection")) {                               // Select the first tab by default
                this.tabView.selectChild(0);
            }
        },
        /**
         * Update specified tab's content. Forward provided entity to template.
         * @private
         * @param {Y.Tab} tab tab to update
         * @param {Entity} entity entity to use for content
         * @returns {undefined}
         */
        updateTabContent: function(tab, entity) {
            tab.set("content", this.TEMPLATES[this.get("template")].content(entity));
        },
        /**
         * @function
         * @private
         * @description Send a REST request to delete selected message
         */
        deleteEmail: function(msg) {
            this.dataSource.sendRequest({
                request: "/Inbox/Message/" + msg.get("id"),
                cfg: {
                    method: "DELETE"
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
            var tab = e.newVal;
            if (this.timer) {                                                   // If there is an active unread message timer,
                this.timer.cancel();                                            // cancel it.
            }
            if (tab && tab.msg && !this.isDestroying) {
                this.dataSource.sendRequest({//                                 // Retrieve the message body from the server
                    request: "/Inbox/Message/" + tab.msg.get("id") + "?view=Extended",
                    cfg: {
                        updateCache: false
                    },
                    on: {
                        success: Y.bind(function(e) {
                            this.updateTabContent(tab, e.response.entity);
                        }, this)
                    }
                });
                if (tab.msg.get("unread")) {                                    // If the message is currently unread,
                    this.timer = Y.later(this.get("setToReadAfter") * 1000, this,
                            function(tab) {                                     // Send a request to mark it as read
                                Y.log("Sending message read update", "info", "InboxDisplay");
                                tab.get("contentBox").one(".unread").removeClass("unread").addClass("read"); // Immediately update view (before request)
                                tab.msg.set("unread", false);                   // Update the message (since there wont be no sync?)
                                this.readRequestTid = this.dataSource.sendRequest({// Send reqest to mark as read
                                    request: "/Inbox/Message/Read/" + tab.msg.get("id"),
                                    cfg: {
                                        method: "PUT"
                                    }
                                });
                            }, tab);
                }
            }
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable) {
                return variable.getEditorLabel();
            }
            return null;
        }
    }, {
        /**
         * @lends Y.Wegas.InboxDisplay
         */
        EDITORNAME: "Inbox",
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
            },
            /**
             *
             */
            template: {
                value: "inbox",
                type: "string",
                choices: [{
                        value: "inbox"
                    }, {
                        value: "clean",
                        label: "No headers"
                    }]
            },
            setToReadAfter: {
                value: 0.05,
                type: "number",
                _inputex: {
                    label: "Mark as read after (s.)",
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            }
        }
    });
    Y.namespace('Wegas').InboxDisplay = InboxDisplay;
});
