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

YUI.add( "wegas-button", function ( Y ) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    LoginButton,
    Button;

    /* @fixme So we can display html tag inside a button */
    Y.Button.prototype._uiSetLabel = function(value) {
        var node = this._host,
        attr = (node.get('tagName').toLowerCase() === 'input') ? 'value' : 'text';

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
    Button = Y.Base.create( "button", Y.Button, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable ], {
        // *** Private fields *** //

        // *** Lifecycle Methods *** //
        initializer: function () {
            Button.superclass.initializer.apply( this, arguments);

            //this.constructor.CSS_PREFIX = "yui3-button";                      // Revert changes done by Y.Wegas.Widget so styling will work
            this._cssPrefix = "yui3-button";

            if ( this.get( "cssClass" ) ) {
                this.get( CONTENTBOX ).addClass( this.get( "cssClass" ) );
            }

            if ( this.get( "tooltip" ) ) {
                this.plug( Y.Plugin.Tooltip, {
                    content: this.get( "tooltip" )
                } );
            }
        },

        renderUI: function () {
            Button.superclass.renderUI.apply( this, arguments );
            this.get( BOUNDINGBOX ).addClass( "wegas-button" );
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
            data: {
                "transient": true
            },
            cssClass: {
                value : null
            }
        }
    });
    Y.namespace('Wegas').Button = Button;

    /**
     * Plugin which adds an unread message counter to a widget.
     *
     * @class Y.Wegas.UnreadCount
     */
    var UnreadCount = function () {
        UnreadCount.superclass.constructor.apply(this, arguments);
    };

    Y.mix(UnreadCount, {
        NS: "button",
        NAME: "UnreadCount",
        ATTRS: {
            variable: {}
        }
    });

    Y.extend(UnreadCount, Y.Plugin.Base, {

        initializer: function () {
            Y.Wegas.app.dataSources.VariableDescriptor.after("response",        // If data changes, refresh
                this.syncUI, this);
            this.afterHostEvent("render", this.syncUI, this);
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
                target.setContent(" (" + unreadCount + ")");
            } else {
                target.setContent("");
            }
        },

        getUnreadCount:  function () {
            var i, instance, messages, count = 0,
            descriptor = Y.Wegas.VariableDescriptorFacade.rest.find('name', this.get('variable'));

            if (!descriptor){
                return 0;
            }

            if (descriptor.get("items")) {                                      // For ListDescriptors, we count the children instance's
                for (i = 0; i < descriptor.get("items").length; i = i + 1) {
                    instance = descriptor.get("items")[i].getInstance();
                    //count += instance.get("unread") ? 1 : 0;
                    count += instance.get("replies").length === 0 && instance.get("active") ? 1 : 0; // only count if it is active
                }
            }

            messages = descriptor.getInstance().get("messages");                // For InboxVariableDescriptors, we count the replies
            if (messages) {
                for (i = 0; i <messages.length; i = i + 1) {
                    count += messages[i].get("unread") ? 1 : 0;
                }
            }

            return count;
        }
    });
    Y.namespace('Plugin').UnreadCount = UnreadCount;

    /**
     * Login button
     */
    LoginButton = Y.Base.create("wegas-login", Y.Wegas.Button, [], {
        bindUI: function () {
            Y.Wegas.LoginButton.superclass.bindUI.apply( this, arguments );

            Y.Wegas.GameFacade.after("response", this.syncUI, this);
            Y.Wegas.app.after("currentPlayerChange", this.syncUI, this);
            this.plug( Y.Plugin.WidgetMenu, {
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
                            url: "wegas-app/view/logout.html",
                            target: "self"
                        }
                    }]
                }]
            });
        },
        syncUI: function () {
            Y.Wegas.LoginButton.superclass.syncUI.apply( this, arguments );

            var cUser = Y.Wegas.app.get( "currentUser" ),
            cPlayer = Y.Wegas.GameFacade.rest.getCurrentPlayer(),
            cTeam = Y.Wegas.GameFacade.rest.getCurrentTeam(),
            name = cUser.name || "undefined";

            if (cPlayer) {
                name = cPlayer.get( "name" );
            }
            if (cTeam) {
                name = cTeam.get( "name" ) + " : " + name;
            }
            this.set( "label", name );
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'LoginButton'
            },
            type: {
                value: "LoginButton"
            }
        }
    });
    Y.namespace('Wegas').LoginButton = LoginButton;

    /**
     * Shortcut to create a Button with an OpenPageAction plugin
     */
    Y.Wegas.OpenPageButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(OpenPageAction, cfg);
        }
    });
});
