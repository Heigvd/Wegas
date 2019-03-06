/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-chat', function(Y) {
    var CONTENTBOX = 'contentBox', Chat;

    Chat = Y.Base.create("wegas-chat", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class='conversation'><div class='wegas-chat-msgs'></div><div class='input-wrapper'><input size='100'></div></div>",
        renderUI: function() {
            var cb = this.get(CONTENTBOX);

            this.send = new Y.Wegas.Button({
                label: "Send",
                cssClass: "wegas-chat-send"
            }).render(cb);
        },
        bindUI: function() {
            this.send.on("click", function() {
                var input = this.get(CONTENTBOX).one("input").getDOMNode();
                var sender = Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("name");

                Y.Wegas.Facade.Pusher.triggerCustomEvent(this.get("channel"), {sender: sender, value: input.value}, this.get("event"));
                input.value = ""
            }, this);

            this.responseEvent = Y.Wegas.Facade.Pusher.on(this.get("event"), function(e) {
                this.get(CONTENTBOX).one('.wegas-chat-msgs').append('<p>' + e.sender + ': ' + e.value + '</p>');
            }, this);
        },
        destructor: function() {
            this.send.destroy();
            this.responseEvent.detach();
        }
    }, {
        EDITORNAME: "Chat",
        ATTRS: {
            size: {
                value: 34,
                view: {
                    label: "Size"
                }
            },
            channel: {
                value: "Game",
                view: {
                    label: "Channel"
                }
            },
            event: {
                value: "chatEvent",
                type: "string",
                view: {
                    label : "Event"
                }
            }
        }
    });
    Y.Wegas.Chat = Chat;

});
