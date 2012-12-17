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

YUI.add("wegas-button", function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    LoginButton,
    Button;

    /* @fixme So we can display html tag inside a button */
    Y.Button.prototype._uiSetLabel = function (value) {
        var node = this._host;
        //attr = (node.get('tagName').toLowerCase() === 'input') ? 'value' : 'text';
        // node.set(attr, value);
        node.setContent(value);
        return value;
    };

    /**
     *  Custom Button implementation. Adds Y.WidgetChild and Y.Wegas.Widget extensions
     *  to the original Y.Button
     *
     *  @class Y.Wegas.Button
     *
     */
    Button = Y.Base.create("button", Y.Button, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable ], {
        // *** Private fields *** //

        // *** Lifecycle Methods *** //
        initializer: function () {
            Button.superclass.initializer.apply(this, arguments);

            //this.constructor.CSS_PREFIX = "yui3-button";                      // Revert changes done by Y.Wegas.Widget so styling will work
            this._cssPrefix = "yui3-button";

            if (this.get("cssClass")) {
                this.get(CONTENTBOX).addClass(this.get("cssClass"));
            }

            if (this.get("tooltip")) {
                this.plug(Y.Plugin.Tooltip, {
                    content: this.get("tooltip")
                });
            }
        },

        renderUI: function () {
            Button.superclass.renderUI.apply(this, arguments);
            this.get(BOUNDINGBOX).addClass("wegas-button");
        }
    }, {
        ATTRS: {
            label: {
                type: "string"
            },
            tooltip: {
                type: "string",
                optional: true,
                "transient": true
            },
            disabled: {
                "transient": false,
                "type": "boolean"
            },
            data: {
                "transient": true
            },
            cssClass: {
                value : null
            },
            plugins: {
                "transient": false,
                _inputex: {
                    _type: "editablelist",
                    items: [{
                        type: "Button",
                        label: "Tooltip",
                        data: "Tooltip"
                    }, {
                        type: "Button",
                        label: "Impact",
                        data: "ExecuteScriptAction"
                    }, {
                        type: "Button",
                        label: "Open page",
                        data: "OpenPageAction"
                    }]
                }
            }
        }
    });
    Y.namespace('Wegas').Button = Button;

    /**
     * Plugin which adds an unread message counter to a widget.
     *
     * @class Y.Wegas.UnreadCount
     */
    var UnreadCount = Y.Base.create("wegas-unreadCount", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {

        initializer: function () {
            this.vdHandler =                                                    // If data changes, refresh
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", this.syncUI, this);
            this.pcHandler =                                                    // If data changes, refresh
            Y.Wegas.app.on("currentPlayerChanger", this.syncUI, this);

            this.afterHostEvent("render", this.syncUI, this);
        },
        destructor: function () {
            this.vdHandler.detach();
            this.pcHandler.detach();
        },
        syncUI: function () {
            var cb = this.get('host').get(CONTENTBOX),
            target = cb.one(".unread-count"),
            unreadCount = this.getUnreadCount();

            if (!target) {                                                      // If the counter span has not been rendered, do it
                cb.append('<span class="unread-count"></span>');
                target = cb.one(".unread-count");
            }

            if (unreadCount > 0) {                                              // Update the content
                target.setContent("<span class='value'>" + unreadCount + "</span>");
            } else {
                target.setContent("");
            }
        },

        getUnreadCount:  function () {
            var i, instance, messages, count = 0,
            descriptor = this.get('variable.evaluated');

            if (!descriptor) {
                return 0;
            }

            if (descriptor.get("items")) {                                      // For ListDescriptors, we count the children instance's
                for (i = 0; i < descriptor.get("items").length; i = i + 1) {
                    instance = descriptor.get("items")[i].getInstance();
                    //count += instance.get("unread") ? 1 : 0;
                    if (instance.get("replies")) {
                        count += instance.get("replies").length === 0 && instance.get("active") ? 1 : 0; // only count if it is active
                    }
                }
            }

            messages = descriptor.getInstance().get("messages");                // For InboxVariableDescriptors, we count the replies
            if (messages) {
                for (i = 0; i < messages.length; i = i + 1) {
                    count += messages[i].get("unread") ? 1 : 0;
                }
            }

            return count;
        }
    }, {
        NS: "UnreadCount",
        NAME: "UnreadCount",
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "List to count unread"
                }
            }
        }
    });
    Y.namespace('Plugin').UnreadCount = UnreadCount;

    /**
     * Login button
     */
    LoginButton = Y.Base.create("wegas-login", Y.Wegas.Button, [], {
        bindUI: function () {
            Y.Wegas.LoginButton.superclass.bindUI.apply(this, arguments);

            Y.Wegas.GameFacade.after("response", this.syncUI, this);
            Y.Wegas.app.after("currentPlayerChange", this.syncUI, this);

            this.plug(Y.Plugin.WidgetMenu, {
                children: [{
                    type: "Button",
                    label: "Preferences",
                    disabled: true
                }, {
                    type: "Button",
                    label: "Logout",
                    plugins: [{
                        fn: "OpenUrlAction",
                        cfg: {
                            url: "wegas-app/logout",
                            target: "self"
                        }
                    }]
                }]
            });
        },
        syncUI: function () {
            Y.Wegas.LoginButton.superclass.syncUI.apply(this, arguments);

            var cUser = Y.Wegas.app.get("currentUser"),
            cPlayer = Y.Wegas.GameFacade.rest.getCurrentPlayer(),
            cTeam = Y.Wegas.GameFacade.rest.getCurrentTeam(),
            name = cUser.name || "undefined";

            if (cPlayer) {
                name = cPlayer.get("name");
            }
            if (cTeam) {
                name = cTeam.get("name") + " : " + name;
            }
            this.set("label", name);
        }
    }, {
        ATTRS : {
            label: {
                "transient": true
            },
            type: {
                value: "LoginButton"
            },
            plugins: {
                "transient": true,
                getter: function () {
                    return [];
                }
            }
        }
    });
    Y.namespace('Wegas').LoginButton = LoginButton;

    /**
     * Shortcut to create a Button with an OpenPageAction plugin
     */
    Y.Wegas.OpenPageButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(Y.Plugin.OpenPageAction, cfg);
        }
    });
});
