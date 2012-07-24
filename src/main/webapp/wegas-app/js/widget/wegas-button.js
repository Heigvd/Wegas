/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-button', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    LoginButton,
    Button;

    /* @fixme hack so we can programatically add an element to a yui button */
    Y.Button.prototype._uiSetLabel = function(value) {
        var node = this._host,
        attr = (node.get('tagName').toLowerCase() === 'input') ? 'value' : 'text';

        //        node.set(attr, value);
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
    Button = Y.Base.create("button", Y.Button, [Y.WidgetChild, Y.Wegas.Widget], {
        // *** Private fields *** //

        // *** Lifecycle Methods *** //
        bindUI: function () {
            if(this.get('tooltips')){
                this.get(CONTENTBOX).on('mouseenter', function () {
                    this.get(CONTENTBOX).insert('<span class="wegas-button-tooltips">'
                        + this.get('tooltips')
                        +'</span>', 'before');
                },this);
                this.get(CONTENTBOX).on('mouseleave', function () {
                    Y.one('.wegas-button-tooltips').remove();
                },this);
            }
        }
    }, {
        ATTRS: {
            tooltips: {}
        },
        CSS_PREFIX:"yui3-button wegas-button"
    });

    Y.namespace('Wegas').Button = Button;


    /**
     *  Plugin which adds an unread message counter to a widget.
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
            this.syncUI();
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
                    count += instance.get("unread") ? 1 : 0;
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
    LoginButton = Y.Base.create("wegas-login", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        bindUI: function () {

            Y.Wegas.GameFacade.after("response", this.syncUI, this);
            Y.Wegas.app.after("currentPlayerChange", this.syncUI, this);
        },
        syncUI: function () {
            var cPlayer = Y.Wegas.app.dataSources.Game.rest.getCurrentPlayer(),
            cTeam = Y.Wegas.app.dataSources.Game.rest.getCurrentTeam(),
            name = "undefined";

            if (cPlayer) {
                name = cPlayer.name;
            }
            if (cTeam) {
                name = cTeam.name + ":" + name;
            }

            this.get(CONTENTBOX).setContent('[' + name + '] <a href="' + Y.Wegas.app.get('base') + 'wegas-app/view/logout.html">logout</a>');
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
     *  @class OpenPageAction
     *  @module Wegas
     *  @constructor
     */
    var OpenPageAction = function () {
        OpenPageAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(OpenPageAction, {
        NS: "wegas",
        NAME: "OpenPageAction"
    });

    Y.extend(OpenPageAction, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent("click", function() {
                var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                targetPageLoader.set("pageId", this.get("subpageId"));
            }, this);
        }
    }, {
        ATTRS: {
            subpageId: {},
            targetPageLoaderId: {}
        }
    });

    Y.namespace("Plugin").OpenPageAction = OpenPageAction;

    /**
     *  @class ExecuteScriptAction
     *  @module Wegas
     *  @constructor
     */
    var ExecuteScriptAction = function () {
        ExecuteScriptAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(ExecuteScriptAction, {
        NS: "wegas",
        NAME: "ExecuteScriptAction"
    });

    Y.extend(ExecuteScriptAction, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent("click", function() {
                Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                    request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: Y.JSON.stringify({
                            "@class": "Script",
                            "language": "JavaScript",
                            "content": this.get("onClick")
                        })
                    }
                });
            }, this);
        }
    }, {
        ATTRS: {
            onClick: {}
        }
    });

    Y.namespace("Plugin").ExecuteScriptAction = ExecuteScriptAction;
});
