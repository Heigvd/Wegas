/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-presence', function(Y) {
    "use strict";
    //@TODO: check connection is established
    var CONTENTBOX = 'contentBox', Chat, pagePresence;
    /**
     * @name Y.Wegas.EditorChat
     * @class
     */
    Chat = Y.Base.create("wegas-editorchat", Y.Widget, [Y.WidgetChild], {
        CONTENT_TEMPLATE: "<div><div class='conversation'>" +
                          "<div class='msgs'></div><ul class='users'></ul><div style='clear: both'></div><textarea  rows='3' class='input' placeholder='Your message'></textarea></div>" +
                          "<div class='footer'><i class='chat-icon fa fa-comments'></i> <span class='count'>Connecting...</span></div></div>",
        initializer: function() {
            var gmID = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id");
            pagePresence = Y.Wegas.Facade.Pusher.subscribe("presence-gm" + gmID);
            //pagePresence.bind_all(Y.bind(this.onEvent, this));
            this.closed = true;
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);

            this.field = cb.one(".input");
            this.send = new Y.Wegas.Button({
                label: "Send",
                cssClass: "chat-send"
            }).render(cb.one(".conversation"));
            this.footer = cb.one(".footer");
            this.get(CONTENTBOX).one(".conversation").toggleClass("closed", this.closed);

        },
        bindUI: function() {
            this.send.on("click", this.sendInput, this);
            this.get(CONTENTBOX).on("clickoutside", function() {
                this.closed = true;
                this.get(CONTENTBOX).one(".conversation").toggleClass("closed", this.closed);
            }, this);
            this.field.on("key", function(e) {
                if (!(e.shiftKey || e.ctrlKey || e.altKey)) {
                    e.halt(true);
                    this.sendInput();
                }
            }, "enter", this);
            this.footer.on("click", function() {
                this.closed = !this.closed;
                this.get(CONTENTBOX).one(".conversation").toggleClass("closed", this.closed);
                this.get(CONTENTBOX).removeClass("new-message");
            }, this);
            //this.get(CONTENTBOX).one(".count").on("click", function() {
            //    var cb = this.get(CONTENTBOX);
            //    cb.one(".users").toggleClass("closed");
            //    cb.one(".msgs").toggleClass("closed");
            //}, this);
            pagePresence.bind("client-message", this.onMessage, this);
            pagePresence.bind('pusher:subscription_succeeded', this.onConnected, this);
            pagePresence.bind("pusher:member_removed", this.onRemoved, this);
            pagePresence.bind("pusher:member_added", this.onAdded, this);
        },
        sendInput: function() {
            var val = this.field.get("value");
            if (val && pagePresence.subscribed) {
                pagePresence.trigger("client-message", {
                    data: val,
                    sender: pagePresence.members.me.info.name
                });
                this.onMessage({sender: "me", data: val});
            }
            this.field.set("value", "");
        },
        onConnected: function() {
            pagePresence.members.each(Y.bind(function(m) {
                if (+m.id !== +pagePresence.members.me.id) {
                    this.onAdded(m);
                } else {
                    this.get(CONTENTBOX).one('.users').append("<li class='me'>me</li>");
                    this.updateCount();
                }
            }, this));
        },
        //onEvent: function(event) {
        //    console.log(event);
        //},
        onRemoved: function(event) {
            this.get(CONTENTBOX).one('.users').one("#user" + event.id).remove(true);
            this.updateCount();
            this.notification(event.info.name + " left");
        },
        onAdded: function(event) {
            this.get(CONTENTBOX).one('.users').append("<li id='user" + event.id + "' class='user'>" + event.info.name + "</li>");
            this.updateCount();
            this.notification(event.info.name + " joined");
        },
        updateCount: function() {
            this.get(CONTENTBOX).one('.count').setHTML("viewer" +
                                                       (pagePresence.members.count > 2 ? "s: " : ": ") +
                                                       (pagePresence.members.count - 1)); //minus self
        },
        addToChat: function(html) {
            var msgBox = this.get(CONTENTBOX).one('.msgs'), node = (html instanceof Y.Node) ? html : Y.Node.create(html);
            msgBox.append(node);
            this.lastNode = node;
            msgBox.getDOMNode().scrollTop = msgBox.getDOMNode().scrollHeight;
            if (this.closed) {
                this.get(CONTENTBOX).addClass("new-message");
            }
        },
        onMessage: function(data) {

            if (this.lastNode && this.lastNode.one(".sender") && this.lastNode.one(".sender").get("text") === data.sender) {
                this.lastNode.append('<div class="content">' + data.data + '</div>');
                this.addToChat(this.lastNode);
            } else {
                this.addToChat('<div class="msg ' + (data.sender === "me" ? "me" : "") +
                               '"><div class="sender">' + data.sender + '</div>' +
                               '<div class="content">' + data.data + '</div></div>');
            }
        },
        notification: function(not) {
            this.addToChat('<div class="notification">' + not + '</div>');
        },
        destructor: function() {
            this.send.destroy();
            this.responseEvent.detach();
        }
    }, {
        EDITORNAME: "Chat",
        ATTRS: {}
    });
    Y.Wegas.EditorChat = Chat;

});
