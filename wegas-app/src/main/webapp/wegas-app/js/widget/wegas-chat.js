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

YUI.add('wegas-chat', function (Y) {
    var CONTENTBOX = 'contentBox',
    Chat = Y.Base.create("wegas-chat", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        renderUI: function () {
            var cb = this.get(CONTENTBOX);
            
            this.conversation = Y.Node.create("<div class='conversation'></div>");
            
            this.conversation.append('</div><div class="wegas-chat-msgs">');
            
            this.field = new Y.inputEx.StringField({
                parentEl: this.conversation,
                typeInvite: "Type here to chat",
                size: this.get("size")
            });
            
            this.send = new Y.Wegas.Button({
                label: "send",
                cssClass: "wegas-chat-send"
            });
            this.send.render(this.conversation);
            this.sendEvent();
            
            cb.append(this.conversation);
        },
        
        sendEvent: function(){
            this.send.on("click", function(){
                // now juste add message
                Y.one('.wegas-chat-msgs').append('<p>' + this.field.getValue() + '</p>');
                this.field.setValue("");
                // TODO send to value to pusher
            }, this);
        }

    }, {
        ATTRS : {
            size: {
                value: 23
            }
        }
    });

    Y.namespace('Wegas').Chat = Chat;
});