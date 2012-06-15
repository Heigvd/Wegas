/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-button', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    LoginButton,
    Button;

    Button = Y.Base.create("wegas-button", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Private fields *** //
        childWidget: null,

        // *** Lifecycle Methods *** //
        renderUI: function () {
        },

        bindUI: function () {
            this.get(CONTENTBOX).on('click', function () {

                if (this.get('onClick')) {                                      // If there is an onclick impact, send it to the server
                    Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({
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
                }

                if (this.get('targetDisplayArea')) {                            // If there is already a widget displayed, we remove it
                    var target = Y.one('#' + this.get('targetDisplayArea') + ' div');
                    if (target.one('div')) {
                        target.one('div').remove();
                    }

                    if (!this.childWidget) {                                    // If there is an a target display area, display the children in it
                        try {
                            this.childWidget = Y.Wegas.Widget.create(this.get("subpage"));
                            this.childWidget.render(target);
                        } catch (e) {
                            Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.Button');
                        }
                    } else {
                        target.append(this.childWidget.get(BOUNDINGBOX));
                    }
                }
            }, this);
            if(this.get('hover')){
                this.get(CONTENTBOX).on('mouseenter', function () {
                    this.get(CONTENTBOX).insert('<span class="wegas-button-hover">'
                        + this.get('hover')
                        +'</span>', 'before');
                },this);
                this.get(CONTENTBOX).on('mouseleave', function () {
                    Y.one('.wegas-button-hover').remove();
                },this);
            }
        },
        syncUI: function () {                                                   // Update the button display
            switch (this.get('view')) {
                case 'button':
                    this.get(CONTENTBOX).setContent('<input type="submit" value="' + this.get('label') + '"></input>');
                    break;
                case 'text':
                default:
                    this.get(CONTENTBOX).setContent("<span>" + this.get('label') + "</span>");
                    break;
            }
        }
    }, {
        ATTRS : {
            onClick: {},
            label: {},
            subpage: {
                value: {
                    'type': 'Text',
                    'content': 'Nothing to display'
                }
            },
            targetDisplayArea: {},
            view: {},
            hover:{}
        }
    });

    Y.namespace('Wegas').Button = Button;

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
            var i, instance,
                dataSource = Y.Wegas.app.dataSources.VariableDescriptor,
                descriptor = dataSource.rest.getCachedVariableBy('name', this.get('variable')),
                count = 0;

            if (!descriptor){
                return 0;
            }
            if (descriptor.items) {                                             // In ListDescriptors, we count the children instance's
                for (i = 0; i < descriptor.items.length; i = i + 1) {
                    instance = dataSource.rest.getDescriptorInstance(descriptor.items[i]);
                    count += instance.unread ? 1 : 0;
                }
            }

            instance = dataSource.rest.getDescriptorInstance(descriptor);
            if (instance.messages) {                                             // In InboxVariableDescriptors, we count the replies
                for (i = 0; i < instance.messages.length; i = i + 1) {
                    count += instance.messages[i].unread ? 1 : 0;
                }
            }

            return count;
        }
    });

    Y.namespace('Plugin').UnreadCount = UnreadCount;

    LoginButton = Y.Base.create("wegas-login", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        bindUI: function () {

            Y.Wegas.app.dataSources.Game.after("response", this.syncUI, this);
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
});