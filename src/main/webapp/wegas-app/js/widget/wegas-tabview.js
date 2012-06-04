/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-tabview', function (Y) {
    "use strict";

    var TabView, Tab;

    TabView = Y.Base.create("tabview", Y.TabView, [Y.WidgetChild, Y.Wegas.Widget], {
        bindUI: function () {
            TabView.superclass.bindUI.apply(this, arguments);

            // @fixme we notify the editor for any change, so widget can be updated
            // this should be done through wiget-parent, widget-child event bubbling
            this.after("selectionChange", function() {
                Y.Wegas.app.fire("layout:resize");
            });
        }
    });

    Tab = Y.Base.create("tab", Y.Tab, [Y.Wegas.Widget], {

        // *** Private Fields *** //
        toolbar: null,

        // *** Lifecycle Methods *** //
        renderUI: function () {
            Tab.superclass.renderUI.apply(this, arguments);

            this._renderToolbar();

            try {
                var cWidget = new Y.Wegas.List({
                    children: this.get('children')
                });
                cWidget.render(this.get('panelNode'));
            } catch (e) {
                Y.log('Error rendering tab ' + this.get('label') + ': ' + (e.stack || e), 'error', 'Wegas.TabView');
            }

        },

        _renderToolbar: function () {
            var panelNode = this.get('panelNode');

            panelNode.addClass('wegas-tab-hastoolbar');
            panelNode.prepend('<div class="yui-editor-container wegas-tab-toolbar"><div class="first-child"><div></div></div></div><div style="clear:both"></div>');

            this.toolbar = new Y.YUI2.widget.Toolbar(panelNode.one('.yui-editor-container div div')._node, {
                buttonType: 'advanced',
                draggable: false,
                buttons: this.get('toolbarButtons')
            // collapse:, cont:, disabled:,  grouplabels:, titlebar: "test",
            });
            if (this.get('toolbarLabel')) {
                panelNode.one('.yui-toolbar-subcont').setContent('<span class="title">' + this.get('toolbarLabel') + '</span></div>');
            }
            this.toolbar.on('buttonClick', function (e) {
                var button = this.toolbar.getButtonByValue(e.button.value),    // We have a button reference
                    p;
                switch (button.get('value')) {
                case 'selectplayer':
                    p = Y.Wegas.app.dataSources.Game.rest.getPlayerById(parseInt(e.button.value, 10));
                    button.set('label', p.name);
                    Y.Wegas.app.set('currentPlayer', e.button.value);
                    break;
                case 'reset':
                    Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({ request: '/reset' });
                    break;
                case 'new':                                                     // New button click event
                    Y.Wegas.editor.showAddPanel({
                        "@class": e.button.data['@class']
                    }, null, Y.Wegas.app.dataSources[e.button.data.dataSource]);
                    break;
                }
            }, null, this);

            Y.Wegas.app.dataSources.Game.after("response", function (e) {
                var menu, button, i, j, k, cGame, players,
                    buttons = this.toolbar.getButtons();

                if (!buttons) {
                    return;
                }

                for (i = 0; i < buttons.length; i += 1) {
                    button = buttons[i];
                    switch (button.get('value')) {
                    case 'selectplayer':
                        //if (button.getMenu().getItems().length == 0) return;
                        //currentPlayerId = Y.Wegas.app.get('currentPlayer');
                        cGame = Y.Wegas.app.dataSources.Game.rest.getCurrentGame();
                        players = [];

                        for (j = 0; cGame.teams && j < cGame.teams.length; j += 1) {
                            for (k = 0; k < cGame.teams[j].players.length; k += 1) {
                                players.push({
                                    text: cGame.teams[j].players[k].name,
                                    value: String(cGame.teams[j].players[k].id)
                                });
                            }
                        }
                        menu = button.getMenu();
                        menu.clearContent();
                        menu.addItems(players);
                        try {
                            menu.render();
                        } catch (e) {
                            Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.WidgetLoader');
                        }
                        break;
                    }
                }
            }, this);
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'Tab'
            },
            type: {
                value: "Tab"
            },
            children: { },
            toolbarButtons: {
                value:[]
            },
            toolbarLabel: {},
            content: {
                setter: function() { }                                          // Overrides the panelNode management
            }
        }
    });

    Y.namespace('Wegas').TabView = TabView;
    Y.namespace('Wegas').Tab = Tab;
});