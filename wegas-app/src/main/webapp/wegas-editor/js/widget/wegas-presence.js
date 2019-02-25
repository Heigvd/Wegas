/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-presence', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', Chat, pagePresence,
        INITIALS_LIMIT_COUNT = 6,
        updateState = function(node, status) {
            var text = "Chat: ";
            switch (status) {
                case "disconnected":
                    text += "Error while connecting";
                    break;
                case "unavailable":
                    text += "Connection lost";
                    break;
                case "initialized":
                case "connecting":
                    text += "Connecting ...";
                    break;
                case "failed":
                    text += "Unsupported browser";
                    break;
                case undefined:
                    text += "Missing pusher";
                    break;
                default:
                    text = "";
            }
            node.set("text", text);
            if (text) {
                node.show();
            } else {
                node.hide();
            }
        };
    /**
     * @name Y.Wegas.EditorChat
     * @class
     */
    Chat = Y.Base.create("wegas-editorchat", Y.Widget, [Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<div>" +
            "<div class='editorchat-footer'>" +
            "  <i class='chat-icon fa fa-comments'></i>" +
            "  <span class='pusher-status'></span>" +
            "  <span class='count'></span>" +
            "  <span class='user-list'></span>" +
            "</div></div>",
        CONTENT_TEMPLATE: null,
        initializer: function() {
            this.closed = true;
            this._handlers = [];
            if (Y.Wegas.Facade.Pusher.get("status")) {
                this._initConnection();
            } else {
                Y.Wegas.Facade.Pusher.once("statusChange", this._initConnection, this);
            }

            this.chatOverlay = new Y.Overlay({
                zIndex: 100,
                cssClass: "yui3-wegas-editorchat",
                constrain: true,
                bodyContent: "<div class='wegas-editorchat-conversation'>" +
                    "  <div class='msgs'></div>" +
                    "  <div style='clear: both'></div>" +
                    "  <textarea  rows='3' class='input' placeholder='Your message'></textarea>" +
                    "</div>",
                visible: false
            }).render();
        },
        _initConnection: function() {
            var gmID = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id");

            pagePresence = Y.Wegas.Facade.Pusher.subscribe("presence-gm" + gmID);
            pagePresence.bind("client-message", this.onMessage, this);
            pagePresence.bind('pusher:subscription_succeeded', this.onConnected, this);
            pagePresence.bind("pusher:member_removed", this.onRemoved, this);
            pagePresence.bind("pusher:member_added", this.onAdded, this);
            //pagePresence.bind_all(Y.bind(this.onEvent, this));
        },
        renderUI: function() {
            this.field = this.chatOverlay.get("contentBox").one(".input");
            this.footer = this.get("contentBox").one(".editorchat-footer");
            //this.get(CONTENTBOX).one(".conversation").toggleClass("closed", this.closed);
            updateState(this.get(CONTENTBOX).one(".pusher-status"), Y.Wegas.Facade.Pusher.get("status"));
        },
        bindUI: function() {
            //this._handlers.push(this.chatOverlay.get(CONTENTBOX).on("clic", function() {
            this._handlers.push(Y.one("body").on("click", function() {
                if (!this.closed) {
                    this.closed = true;
                    this.chatOverlay.hide();
                }
            }, this));
            this._handlers.push(Y.Wegas.Facade.Pusher.on("statusChange", function(e) {
                updateState(this.get(CONTENTBOX).one(".pusher-status"), e.newVal);
            }, this));
            this._handlers.push(this.field.on("key", function(e) {
                if (!(e.shiftKey || e.ctrlKey || e.altKey)) {
                    e.halt(true);
                    this.sendInput();
                }
            }, "enter", this));

            this._handlers.push(this.chatOverlay.get("contentBox").on("click", function(e) {
                // do not bubble
                e.halt(true);
            }, this));
            this._handlers.push(this.footer.on("click", function(e) {
                if (this.closed) {
                    this.closed = false;

                    Y.later(0, this, function() {
                        this.chatOverlay.get("boundingBox").setStyle("left", this.get("boundingBox").getDOMNode().getBoundingClientRect().x
                            - this.chatOverlay.get("contentBox").getDOMNode().getBoundingClientRect().width - 10);
                    });

                    this.chatOverlay.show();
                    //this.get(CONTENTBOX).one(".conversation").toggleClass("closed", this.closed);
                    this.get(CONTENTBOX).removeClass("new-message");
                    this.get(CONTENTBOX).all("span").removeClass("new-message");
                    e.halt(true);
                }
            }, this));
        },
        sendInput: function() {
            var val = this.field.get("value");
            if (val && pagePresence.subscribed) {
                pagePresence.trigger("client-message", {
                    data: val,
                    sender: pagePresence.members.me.id
                });
                this.onMessage({
                    sender: pagePresence.members.me.id,
                    data: val
                });
            }
            this.field.set("value", "");
        },
        onConnected: function() {
            pagePresence.members.each(Y.bind(function(m) {
                if (+m.id !== +pagePresence.members.me.id) {
                    this.onAdded(m);
                } else {
                    this.updateCount();
                }
            }, this));
        },
        onRemoved: function(event) {
            this.updateCount();
            this.notification(event.info.name + " left");
            this.get(CONTENTBOX).one(".user-list").all(".u" + event.id).remove(true);
        },
        onAdded: function(event) {
            var uList = this.get(CONTENTBOX).one(".user-list"), initials;
            this.updateCount();
            this.notification(event.info.name + " joined");
            if (uList.get("children").size() < INITIALS_LIMIT_COUNT) {
                initials = event.info.name.match(/\b\w/g).join("");
                uList.append("<span class='u" + event.id + "' title='" + event.info.name + "'>" + initials + "</span>");
            }
        },
        updateCount: function() {
            var count = pagePresence.members.count - 1; // minus self
            // this.get(CONTENTBOX)
            //     .one('.count')
            //     .setHTML('viewer' + (count > 1 ? 's: ' : ': ') + count);
            if (count > 0) {
                this.get(CONTENTBOX)
                    .one('.chat-icon')
                    .removeClass('disabled');
                // this.get(CONTENTBOX)
                //     .one('.count')
                //     .setHTML('viewer' + (count > 1 ? 's: ' : ': ') + count);
            } else {
                this.get(CONTENTBOX)
                    .one('.chat-icon')
                    .addClass('disabled');
                this.get(CONTENTBOX)
                    .one('.count')
                    .setHTML('');
            }
        },
        addToChat: function(html, notification) {
            var msgBox = this.chatOverlay.get(CONTENTBOX).one('.msgs'),
                node = (html instanceof Y.Node) ? html :
                Y.Node.create(html);
            msgBox.append(node);
            this.lastNode = node;
            msgBox.getDOMNode().scrollTop = msgBox.getDOMNode().scrollHeight;
            if (this.closed && !notification) {
                this.get(CONTENTBOX).addClass("new-message");
            }
        },
        onMessage: function(data) {
            var sender = ((pagePresence.members.me.id === data.sender) ? "me" : pagePresence.members.get(data.sender).info.name);
            data.data = Y.Escape.html(data.data);
            if (sender !== "me") {
                Y.Wegas.Alerts.showNotification(sender + " sent a message in the chat room", {timeout: 2000});
            }
            this.addToChat('<div class="msg ' + (sender === "me" ? "me" : "") +
                '"><div class="sender">' + sender + " (" + (new Date()).toLocaleTimeString() + ')</div>' +
                '<div class="content">' + data.data + '</div></div>');
            //}
            if (this.closed) {
                this.get(CONTENTBOX).all(".u" + data.sender).addClass("new-message");
            }
        },
        notification: function(not) {
            this.addToChat('<div class="notification">' + not + '</div>', true);
        },
        destructor: function() {
            Y.Array.each(this._handlers, function(i) {
                i.detach();
            });
        }
    }, {
        EDITORNAME: "Chat",
        ATTRS: {}
    });
    Y.Wegas.EditorChat = Chat;

});
