/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

YUI.add('wegas-chat', function(Y) {
    var CONTENTBOX = 'contentBox',
            Chat = Y.Base.create("wegas-chat", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        CONTENT_TEMPLATE: "<div class='conversation'><div class='wegas-chat-msgs'></div></div>",
        initializer: function() {
            this.push = Y.Wegas.PusherConnectorFactory.getConnector("732a1df75d93d028e4f9");
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);

            this.field = new Y.inputEx.StringField({
                parentEl: cb,
                typeInvite: "Type here to chat",
                size: this.get("size")
            });
            cb.append(this.field);
            this.send = new Y.Wegas.Button({
                label: "send",
                cssClass: "wegas-chat-send",
                render: cb
            });
            cb.append(this.send);
        },
        bindUI: function() {
            this.send.on("click", function() {
                var sender = Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("name");
                Y.Wegas.PusherConnectorFactory.getConnector().triggerCustomEvent(this.get("channel"), {sender: sender, value: this.field.getValue()}, this.get("event"));
                this.field.setValue("");
            }, this);

            this.responseEvent = Y.Wegas.PusherConnectorFactory.getConnector().on(this.get("event"), function(e) {
                this.get(CONTENTBOX).one('.wegas-chat-msgs').append('<p>' + e.sender + ': ' + e.value + '</p>');
            }, this);
        },
        destructor: function() {
            this.send.destroy();
            this.responseEvent.detach();
        }
    }, {
        ATTRS: {
            size: {
                value: 23
            },
            channel: {
                value: "Game"
            },
            event: {
                value: "chatEvent",
                type: "string",
                initOnly: "true"
            },
            dataSource: {
            }
        }
    });

    Y.namespace('Wegas').Chat = Chat;
});