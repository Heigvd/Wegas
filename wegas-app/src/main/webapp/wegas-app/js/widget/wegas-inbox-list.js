/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence 
 */
YUI.add('wegas-inbox-list', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox',
        InboxList;


    InboxList = Y.Base.create(
        'wegas-inbox-list',
        Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent],
        {
            initializer: function() {
                this.handlers = {};
                this.messages = {};
                this.errorMessage;
            },
            destructor: function() {
                for (var k in this.handlers) {
                    this.handlers[k].detach();
                }
            },
            renderUI: function() {
                this.destroyAll();
            },

            bindUpdatedInstance: function() {
                if (this.handlers.onInstanceUpdate) {
                    this.handlers.onInstanceUpdate.detach();
                }
                var inbox = this.get('variable.evaluated');
                if (inbox) {
                    this.handlers.onInstanceUpdate = Y.Wegas.Facade.Instance.after(inbox.getInstance().get("id") + ':updatedInstance', this.syncUI, this);
                }
            },
            bindUI: function() {
                this.bindUpdatedInstance();
                this.after("variableChange", this.bindUpdatedInstance, this);
                this.get(CONTENTBOX).delegate('click', this.toggleExpand, '.wegas-message__collapsed', this);
                this.get(CONTENTBOX).delegate('click', this.toggleCollapse, '.wegas-message__expanded .wegas-message-header', this);
            },
            toggleCollapse: function(e) {
                Y.later(0, this, function() {
                    var msg = e.currentTarget.ancestor(".wegas-message__expanded");
                    msg.addClass('wegas-message__collapsed');
                    msg.removeClass('wegas-message__expanded');
                });
            },
            toggleExpand: function(e) {
                // Whenever a collapsed message is clicked,
                if (this.get("collapsed")) {
                    this.get("contentBox").all(".wegas-message").each(function(msg) {
                        msg.removeClass("wegas-message__expanded");
                        msg.addClass("wegas-message__collapsed");
                    });


                    var message = Y.Widget.getByNode(e.currentTarget).getMessage();
                    if (message && message.get('unread')) {
                        Y.Wegas.Facade.Variable.sendRequest({request: '/Inbox/Message/Read/' + message.get('id') + "/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                            cfg: {
                                method: 'PUT'
                            }
                        });
                    }
                }

                Y.later(0, this, function() {
                    e.currentTarget.removeClass('wegas-message__collapsed'); // open it
                    e.currentTarget.addClass('wegas-message__expanded'); // open it
                });
            },
            removeErrorMessage: function() {
                this.errorMessage && this.errorMessage.destroy();
                this.errorMessage = null;
            },
            setErrorMessage: function(message) {
                this.removeErrorMessage();
                this.errorMessage = new Y.Wegas.Text({
                    content: '<center><em>' + message + '</em></center>',
                    editable: false
                });
                this.add(this.errorMessage);
            },
            syncUI: function() {
                var cb = this.get("contentBox"),
                    inboxDescriptor = this.get('variable.evaluated'),
                    inboxInstance = inboxDescriptor.getInstance();

                if (this.get('destroyed')) {
                    return;
                }
                // toggle template classes
                for (var k in Y.Wegas.InboxList.ATTRS.template.view.choices) {
                    var template = Y.Wegas.InboxList.ATTRS.template.view.choices[k].value;
                    this.get("contentBox").toggleClass("wegas-inbox-list--" + template, this.get("template") === template);
                }
                this.get("contentBox").toggleClass("wegas-inbox-list--collapsed", this.get("collapsed"));

                if (!inboxDescriptor) {
                    this.setErrorMessage('Unable to find inbox variable');
                } else {
                    var readMessages = false,
                        messages = inboxInstance.get("messages").slice(0);

                    if (messages.length === 0) {
                        cb.setHTML('<center><em>Empty</em></center>');
                    } else {
                        this.removeErrorMessage();
                        if (this.get("chronological")) {
                            messages.reverse();
                        }
                        for (var i in messages) {
                            var message = messages[i];
                            if (this.messages[message.get("id")]) {
                                if (this.item(i) !== this.messages[message.get("id")]) {
                                    //this.remove(this.messages[message.get("id")]);
                                    this.messages[message.get("id")].remove();
                                    this.add(this.messages[message.get("id")], i);
                                }
                                // mark as read !
                                this.messages[message.get("id")].syncUI();
                            } else {
                                this.messages[message.get("id")] = new Y.Wegas.MessageDisplay({
                                    variable: this.get("variable"),
                                    messageId: message.get("id"),
                                    editable: false
                                });
                                this.add(this.messages[message.get("id")], +i);
                            }
                            readMessages = readMessages || message.get("unread");
                        }

                        if (readMessages && !this.get("collapsed")) {
                            Y.Wegas.Facade.Variable.sendRequest({// Send reqest to mark as read
                                request: "/Inbox/" + inboxInstance.get("id") + "/ReadAll" + "/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                                cfg: {
                                    method: 'PUT'
                                }
                            });
                        }

                        for (var i in this.messages) {
                            var m = this.messages[i];
                            var bb = m.get("boundingBox");
                            if (this.get("collapsed")) {
                                if (bb.hasClass("wegas-message__expanded")) {
                                    bb.removeClass("wegas-message__collapsed");
                                } else if (bb.hasClass("wegas-message__expanded")) {
                                    bb.removeClass("wegas-message__collapsed");
                                } else {
                                    bb.addClass("wegas-message__collapsed");
                                }
                            } else {
                                /*
                                 * If the content is bigger than the available height (max-height style)
                                 *  add msg-body-toggled class and content of the read more menu
                                 */
                                var body = bb.one('.wegas-message-body');
                                var maxHeight = parseInt(body.getStyle('maxHeight')),
                                    effectiveHeight = parseInt(body.getDOMNode().getBoundingClientRect().height);
                                bb.toggleClass("wegas-message__collapsed", maxHeight < effectiveHeight);
                                bb.toggleClass("wegas-message__expanded", maxHeight >= effectiveHeight);
                            }
                        }
                    }
                }
            }
            ,
            getEditorLabel: function() {
                var variable = this.get('variable.evaluated');
                if (variable) {
                    return variable.getEditorLabel();
                }
                return null;
            }
        },
        {
            /**
             * @lends Y.Wegas.InboxList
             */
            EDITORNAME: 'Inbox list',
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
                    type: 'object',
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: 'variable',
                        classFilter: 'InboxDescriptor'
                    }
                },
                /**
                 *
                 */
                template: {
                    value: 'default',
                    type: 'string',

                    view: {
                        type: 'select',
                        choices: [
                            {
                                value: 'default'
                            }, {
                                value: 'clean'
                            }
                        ],
                        label: 'Template',
                        className: 'wegas-advanced-feature'
                    }

                },
                chronological: {
                    value: true,
                    type: "boolean",
                    view: {
                        label: "chronological"
                    }
                },
                collapsed: {
                    value: false,
                    type: "boolean",
                    view: {
                        label: "collapse"
                    }
                }
            }
        }
    );
    Y.Wegas.InboxList = InboxList;
});
