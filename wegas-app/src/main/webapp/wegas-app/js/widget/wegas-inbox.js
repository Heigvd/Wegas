/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Maxence
 */
YUI.add('wegas-inbox', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox',
        InboxDisplay,
        MessageDisplay;

    MessageDisplay = Y.Base.create("wegas-message", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: ""
            + "<div class=\"wegas-message-display\">"
            + "  <div class=\"wegas-message-header\">"
            + "    <div class=\"wegas-message-header__line\">"
            + "      <div class=\"wegas-message-header__subject\"></div>"
            + "      <div class=\"wegas-message-header__date\"></div>"
            + "    </div>"
            + "    <div class=\"wegas-message-header__line\">"
            + "      <div class=\"wegas-message-header__from\"></div>"
            + "    </div>"
            + "  </div>"
            + "  <div class=\"wegas-message-attachments\"></div>"
            + "  <div class=\"wegas-message-body\">"
            + "  </div>"
            + "</div>",
        initializer: function() {
            this.handlers = {};
        },
        getMessage: function() {
            var messages = this.get("variable.evaluated").getInstance().get("messages"),
                messageId = this.get("messageId");
            return Y.Array.find(messages, function(item) {
                return item.get("id") === messageId;
            });
        },
        updateContent: function(selector, newValue){
            var node = this.get("contentBox").one(selector);
            // @hack injector: Place both href and src so it works for a and img tags
            var v = newValue.replace(
                new RegExp('data-file="([^"]*)"', 'gi'),
                "src=\"" + Y.Wegas.Facade.File.getPath() + "$1\""
                + " href=\"" + Y.Wegas.Facade.File.getPath() + "$1\"");

            if (node.getContent() !== v){
                node.setContent(v);
            }
        },
        syncUI: function() {
            var cb = this.get("contentBox"),
                message = this.getMessage();
            if (message) {
                cb.toggleClass("unread", message.get("unread"));

                this.updateContent(".wegas-message-header__subject", I18n.t(message.get("subject")));
                this.updateContent(".wegas-message-header__date", I18n.t(message.get("date")));
                this.updateContent(".wegas-message-header__from", I18n.t(message.get("from")));
                this.updateContent(".wegas-message-body", I18n.t(message.get("body")));
                
 
                /*cb.one(".wegas-message-header__subject")
                    .setContent(I18n.t(message.get("subject")));
                cb.one(".wegas-message-header__date")
                    .setContent(I18n.t(message.get("date")));
                cb.one(".wegas-message-header__from")
                    .setContent(I18n.t(message.get("from")));
                cb.one(".wegas-message-body")
                    .setContent(I18n.t(message.get("body")));*/
                var attsNode = cb.one(".wegas-message-attachments");
                attsNode.setContent();
                var atts = message.get("attachments");
                for (var i in atts) {
                    var a = atts[i],
                        url = I18n.t(a.get('file'));
                    attsNode.append("<a href='" + url + "' data-file='" + url + "' target='_blank'>" + url.split('/').pop() + "</a>");
                }
            }
        }
    }, {
        ATTRS: {
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER
            },
            messageId: {
                type: 'number'
            }
        }
    });
    Y.Wegas.MessageDisplay = MessageDisplay;


    InboxDisplay = Y.Base.create("wegas-inbox", Y.Wegas.ResponsiveTabView, [], {
        syncUI: function() {
            Y.Wegas.InboxDisplay.superclass.syncUI.call(this);

            for (var k in Y.Wegas.InboxDisplay.ATTRS.template.view.choices) {
                var template = Y.Wegas.InboxDisplay.ATTRS.template.view.choices[k].value;
                this.get("contentBox").toggleClass(template, this.get("template") === template);
            }
        },
        getTabLabel: function(entity) {
            var from = I18n.t(entity.get("from")),
                subject = I18n.t(entity.get("subject")),
                date = I18n.t(entity.get("date")),
                unread = entity.get("unread");
            return ""
                + "<div class='wegas-inbox--tabtitle " + (unread ? "unread" : "read") + "'>"
                + "  <div class='wegas-inbox--tabtitle__line'>"
                + "    <div class='wegas-inbox--tabtitle__subject'>" + subject + "</div>"
                + "    <div class='wegas-inbox--tabtitle__date'>" + date + "</div>"
                + "  </div>"
                + "  <div class='wegas-inbox--tabtitle__line'>"
                + "    <div class='wegas-inbox--tabtitle__from'>" + from + "</div>"
                + "  </div>"
                + "</div>";
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable && variable.getEditorLabel) {
                return Y.Wegas.InboxDisplay.EDITORNAME + ": " +
                    variable.getEditorLabel();
            }
            return Y.Wegas.InboxDisplay.EDITORNAME;
        },
        getEntities: function() {
            return this.get("variable.evaluated").getInstance().get("messages");
        },
        getNoContentMessage: function() {
            return Y.Wegas.I18n.t('inbox.noMessages');
        },
        getNothingSelectedInvite: function() {
            return Y.Wegas.I18n.t('inbox.noMessageSelected');
        },
        getWidget: function(entity) {
            if (entity instanceof Y.Wegas.persistence.Message) {
                if (this.timer) {
                    this.timer.cancel();
                }
                if (entity.get('unread')) {
                    this.timer = Y.later(this.get('setToReadAfter') * 1000, this,
                        function(message) {
                            Y.Wegas.Facade.Variable.sendRequest({request: '/Inbox/Message/Read/' + message.get('id') + "/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                                cfg: {
                                    method: 'PUT'
                                }
                            });
                        }, entity);
                }

                return new Y.Wegas.MessageDisplay({
                    variable: this.get("variable"),
                    messageId: entity.get("id")
                });
            }
        }
    }, {
        EDITORNAME: "Inbox display",
        ATTRS: {
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Variable',
                    classFilter: 'InboxDescriptor'
                }
            },
            template: {
                value: 'inbox',
                type: 'string',
                view: {
                    type: 'select',
                    choices: [
                        {
                            value: 'inbox'
                        },
                        {
                            value: 'clean',
                            label: 'No headers'
                        }
                    ],
                    className: 'wegas-advanced-feature',
                    label: "Template"
                }
            },
            setToReadAfter: {
                value: 0.05,
                type: 'number',
                view: {
                    label: 'Mark as read after (s.)',
                    className: 'wegas-advanced-feature'
                }
            },
            autoOpenFirst: {
                type: 'boolean',
                "transient": true,
                getter: function() {
                    return this.get("autoOpenFirstMail");
                }
            },
            autoOpenFirstMail: {
                value: false,
                type: 'boolean',
                view: {
                    label: 'Automatically open first mail'
                }
            }
        }
    });
    Y.Wegas.InboxDisplay = InboxDisplay;
});
