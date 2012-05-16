/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-inbox', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    InboxDisplay;

    InboxDisplay = Y.Base.create("wegas-inbox", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Private Fields *** //
        tabView: null,
        dataSource: null,

        // *** Lifecycle Methods *** //
        renderUI: function () {
            this.dataSource = Y.Wegas.app.dataSources.VariableDescriptor;
            this.tabView = new Y.TabView();
            this.tabView.render(this.get(CONTENTBOX).append('<div></div>'));
        },

        bindUI: function () {
            this.dataSource.after("response", this.syncUI, this);
            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
            this.tabView.after("selectionChange", this.onTabSelected, this)
        },


        syncUI: function () {
            var i, msg, tab,
                inboxVariable = this.dataSource.rest.getInstanceBy('name', this.get('variable')),
                selectedTab = this.tabView.get('selection'),
                lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

            this.tabView.removeAll();
            for (i = inboxVariable.messages.length - 1; i >= 0; i -= 1) {
                msg = inboxVariable.messages[i];
                msg.from = msg.from || "admin@wegas.com";
                tab = new Y.Tab({
                    label: '<div class="' + (msg.unread ? "unread" : "read") + '"><div class="left">' + msg.from + '</div>'
                        + '<div class="right">' + msg.subject + '</div></div>',
                    content: '<div class="subject">Subject: ' + msg.subject + '</div>'
                        + '<div class="from">From: ' + msg.from + '</div>'
                        + '<div class="body">' + msg.body + '</div>'
                });

                tab.msg = msg;
                this.tabView.add(tab);
            }

            if (inboxVariable.messages.length === 0) {
                this.tabView.add({
                    label: '',
                    content: '<center><em>You have no messages</em></center>'
                });
            }

            this.tabView.selectChild(lastSelection);
        },

        // *** Private Methods *** //
        onTabSelected: function (e) {
            if (this.timer) {                                                   // If there is an active unread
                this.timer.cancel();                                            // message timer, we cancel it.
            }

            if (e.newVal && e.newVal.msg.unread) {                              // If the message is currently unread,
                this.msg = e.newVal.msg;
                this.timer = Y.later(2000, this, function () {
                    Y.log("Sending message read update", "info",  "InboxDisplay");
                    this.msg.unread = false;
                    this.dataSource.rest.sendRequest({
                        request: "/InboxDescriptor/Message/" + this.msg.id,
                        cfg: {
                            method: "PUT",
                            data: Y.JSON.stringify(this.msg)
                        }
                    });
                });
            }
        }

    }, {
        ATTRS : {
            variable: {}
        }
    });

    Y.namespace('Wegas').InboxDisplay = InboxDisplay;
});