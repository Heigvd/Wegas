/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-inbox-list', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', Micro = Y.Template.Micro, Wegas = Y.Wegas,
        InboxList;
    /**
     * @name Y.Wegas.InboxList
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class to manage e-mail
     * @constructor
     * @description Display and allow to manage e-mail sent to the current player
     */
    InboxList = Y.Base.create("wegas-inbox-list", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.InboxList# */
        // ** Private fields ** //
        /**
         * Holds compiled templates. Add templates in scope variable TEMPLATES
         *
         * define tab and content Templates, add new ones :
         * TEMPLATES:{TEMPLATE_NAME:{tab:'template', content:'template'}}
         *
         * specify the one to use in "template" ATTRS
         * !!COMPILED!! Template may be added after initialization in
         * Y.Wegas.InboxList.prototype.TEMPLATES['name'] =
         * {tab: Y.Template.Micro.compile(tab_text_template),
         * content: Y.Template.Micro.compile(content_text_template)}
         */
        TEMPLATES: {
            "default": Micro.compile("<div class='msg msg-toggled'><div class='msg-header'>"
                + "<div class='msg-subject'><%=this.get('subject')%></div>"
                + "<% if (this.get('date')) { %><div class='msg-date'><%= this.get('date') %></div><% } %>"
                + "<div style=\"clear: both;\"></div>"
                + "<% if (this.get('from')) { %><div class='msg-from'><%= this.get('from') %></div><% } %>"
                + "<% if (this.get('attachements') && this.get('attachements').length) {%>"
                + "<div class='msg-attachement'><% Y.Array.each(this.get('attachements'), function(a){ %><a href='<%= a %>' data-file='<%= a %>' target='_blank'><%= a.split('/').pop() %></a>;<% }); %></div>"
                + "<% } %><div style=\"clear: both;\"></div></div>"
                + "<div class='msg-body'><div class='msg-body-content'><%== this.get('body') %></div></div>"
                + "<a href='#' class='msg-showmore'>More...</a>"
                + "</div>"),

            clean: Micro.compile("<div class='msg-cleanlist'>"
                + "<div class='msg-icon'><i class='fa fa-2x fa-envelope<%= this.get('unread') ? '' : '-open'%>-o'></i></div>"
                + "<div class='msg-clean--header'>"
                + "<div class='msg-firstLine'>"
                + "<span class='msg-subject'><%== this.get('subject')%></span>"
                + "<% if (this.get('date')){ %><span class='msg-date'><%== this.get('date') %></span><% } %>"
                + "</div>"
                + "<div style=\"clear: both;\"></div>"
                + "<% if (this.get('from')){ %><div class='msg-from'><span><%== this.get('from') %></span></div><% } %>"
                + "</div>"
                + "<% if (this.get('attachements') && this.get('attachements').length) {%>"
                + "<div class='msg-attachement'><% Y.Array.each(this.get('attachements'), function(a){ %><a href='<%= a %>' data-file='<%= a %>' target='_blank'><%= a.split('/').pop() %></a>;<% }); %></div>"
                + "<% } %>"
                + "<div style=\"clear: both;\"></div>"
                + "<div class='msg-body'> <%== this.get('body') %></div>"
                + "</div>"
                )
        },
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description bind function to events.
         * When dataSource is updated, do syncUI
         */
        bindUI: function() {
            this.dataUpdatedHandler = Wegas.Facade.Instance.after("updatedInstance", this.onUpdatedInstance, this); // Sync view on cache update

            this.get(CONTENTBOX).delegate("click", function(e) {                // Whenever a collapsed message is clicked,
                e.currentTarget.toggleClass("msg-toggled"); // open it
            }, ".msg-toggled");
        },
        onUpdatedInstance: function(e) {
            if (e.entity.get("id") === this.get("variable.evaluated").getInstance().get("id")) {
                this.syncUI();
            }
        },
        /**
         * @function
         * @private
         * Re-select the current selected msg;
         */
        syncUI: function() {
            var inboxDescriptor = this.get('variable.evaluated'),
                inboxInstance = inboxDescriptor.getInstance();
            if (!inboxDescriptor) {
                this.get(CONTENTBOX).setHTML("<center><em>Unable to find inbox variable</em></center>");
                return;
            }
            this.get("contentBox").addClass("wegas-inbox-list--" + this.get("template"));
            this.showOverlay();

            Wegas.Facade.Variable.cache.getWithView(inboxInstance, "Extended", {
                on: {
                    success: Y.bind(function(e) {
                        if (this.get("destroyed")) {
                            return;
                        }
                        this._updateView(e.response.entity, e.response.entity.get("messages"));
                        this.hideOverlay();
                    }, this)
                }
            });
        },
        /**
         * @function
         * @private
         * @description Destroy all eventHandlers created by this widget
         */
        destructor: function() {
            this.dataUpdatedHandler.detach();
        },
        // *** Private Methods *** //
        /**
         * @private
         * @param {Array of entity} entities
         * @returns {undefined}
         */
        _updateView: function(inboxInstance, entities) {
            var cb = this.get(CONTENTBOX), readMessages = false;
            cb.setContent("");
            if (entities.length === 0) {
                cb.setHTML("<center><em>Empty</em></center>");
            }
            if (this.get("chronological")) {
                entities.reverse();
            }
            Y.Array.each(entities, function(entity) {
                cb.append(this.TEMPLATES[this.get("template")](entity));
                if (entity.get("unread")) {
                    readMessages = true;
                }
            }, this);
            if (readMessages) {
                Y.Wegas.Facade.Variable.sendRequest({// Send reqest to mark as read
                    request: "/Inbox/" + inboxInstance.get("id") + "/ReadAll",
                    cfg: {
                        method: "PUT"
                    }
                });
            }

            cb.all(".msg").each(function(m) {
                /*
                 * If the content is bigger than the available height (max-height style)
                 *  add msg-body-toggled class and content of the read more menu
                 */
                if (parseInt(m.one(".msg-body").getStyle("maxHeight"))
                    > parseInt(m.one(".msg-body-content").getComputedStyle("height"))) {
                    m.removeClass("msg-toggled");
                }
            });
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
         * @lends Y.Wegas.InboxList
         */
        EDITORNAME: "Inbox list",
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
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: "InboxDescriptor"
                }
            },
            /**
             *
             */
            template: {
                value: "default",
                type: "string",
                choices: [{
                        value: "default"
                    }],
                _inputex: {
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            },
            chronological: {
                value: true,
                type: "boolean"
            }
        }
    });
    Wegas.InboxList = InboxList;
});
