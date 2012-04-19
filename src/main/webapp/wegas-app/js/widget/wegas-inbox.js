/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-inbox', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    InboxDisplay;

    InboxDisplay = Y.Base.create("wegas-inbox", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        _tabView: null,

        // *** Lifecycle Methods *** //
        bindUI: function () {
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", this.syncUI, this);
            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
        },

        syncUI: function () {
            var i, msg,
                inboxVariable = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceBy('name', this.get('variable')),
                selectedTab = this._tabView.get('selection'),
                lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

            this._tabView.removeAll();
            for (i = inboxVariable.messages.length - 1; i >= 0; i -= 1) {
                msg = inboxVariable.messages[i];
                msg.from = msg.from || "admin@wegas.com";

                this._tabView.add({
                    label: '<div class="left">' + msg.from + '</div><div class="right">' + msg.subject + '</div>',
                    content: '<div class="subject">Subject: ' + msg.subject + '</div>'
                        + '<div class="from">From: ' + msg.from + '</div>'
                        + '<div class="body">' + msg.body + '</div>'
                });
            }

            if (inboxVariable.messages.length === 0) {
                this._tabView.add({
                    label: '',
                    content: '<center><em>You have no messages</em></center>'
                });
            }

            /* @fixme */
            Y.later(100, this, function () {
                this._tabView.selectChild(lastSelection);
            });
        },
        renderUI: function () {
            this._tabView = new Y.TabView({
                children: []
            });
            this._tabView.render(this.get(CONTENTBOX).append('<div></div>'));
        }
    }, {
        ATTRS : {
            variable: {}
        }
    });

    Y.namespace('Wegas').InboxDisplay = InboxDisplay;
});