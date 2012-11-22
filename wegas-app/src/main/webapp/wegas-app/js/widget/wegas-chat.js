/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-chat', function (Y) {
    var CONTENTBOX = 'contentBox',
    Chat = Y.Base.create("wegas-chat", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /* destructor: function() {

            //$.atmosphere.unsubscribe();
        },*/
        renderUI: function () {
            return;

            var atmospherePath = Y.Wegas.app.get('base')+"atmosphere/pubsub/GeneralChat",
            connectedEndpoint,
            cb = this.get(CONTENTBOX),
            form = new Y.inputEx.Form( {
                parentEl: cb._node,
                fields: [{
                    name: 'text',
                    type:'text',
                    rows: 3,
                    cols: 40,
                    typeInvite: 'Type here to chat',
                    value: ''
                }],
                buttons: [{
                    type: 'submit',
                    value: 'Send'
                }],
                onSubmit: function(e) {
                    connectedEndpoint.push(atmospherePath,
                        null,
                        $.atmosphere.request = {
                            data: 'message='+this.getValue().text
                        });
                    this.setValue({
                        text:''
                    });
                    return false;
                }
            });

            $.atmosphere.subscribe(atmospherePath,                                    // Subscribe to websocket events.
                function(response) {
                    Y.log("Response(state: "+response.state+", transport: "+response.transport+", status:"+response.status+", body: "+ response.responseBody+")", 'info', 'Wegas.Chat');

                    if (response.transport != 'polling' && response.state == 'messageReceived' && response.status == 200 && response.responseBody.length > 0) {
                        cb.one('.wegas-chat-msgs').prepend('<div class="wegas-chat-msg">You: '+response.responseBody+'</div>');
                    }
                },
                /* websocket, streaming, long-polling, jsonp */
                $.atmosphere.request = {
                    transport: 'long-polling'
                /*, Uncomments for IE CORS support attachHeadersAsQueryString : true, enableXDR : true */
                });
            connectedEndpoint = $.atmosphere.response;

            cb.append('<div style="clear:both"></div><div class="wegas-chat-msgs"></div>');

            /*
             * Note this is the fasted was to trim in js.
             * @fixme This function should be moved to some utility class
             */
            function trim(str) {
                return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            }
            cb.one('textarea').on('key',  function(event) {
                connectedEndpoint.push(atmospherePath,
                    null,
                    $.atmosphere.request = {
                        data: 'message='+trim(form.getValue().text)
                    });
                form.setValue({
                    text:''
                });
                event.preventDefault();
            }, 'enter');
        }/*,
        bindUI: function() {}*/
    }, {
        ATTRS : {
            classTxt: {
                value: 'Chat'
            },
            type: {
                value: "Chat"
            }
        }
    });

    Y.namespace('Wegas').Chat = Chat;
});