/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-tabview', function(Y) {
    var YAHOO = Y.YUI2,
    
    TabView = Y.Base.create("tabview", Y.TabView , [Y.WidgetChild, Y.Wegas.Widget], {
        
        }, {
            ATTRS : {
                classTxt: {
                    value: 'Tabview'
                },
                type: {
                    value: "Tabview"
                }
            }
        }),
	
    Tab = Y.Base.create("tab", Y.Tab , [Y.Wegas.Widget/*, Y.WidgetParent*/], {
        
        _toolbar: null,
        
        renderUI: function() {
            Tab.superclass.renderUI.apply(this, arguments);
            
            this._renderToolbar();
            
            try {
                var cWidget = new Y.Wegas.List({
                    children:this.get('children')
                });
                cWidget.render(this.get('panelNode'));
            } catch (e) {
                Y.log('Error rendering tab '+this.get('label')+': '+((e.stack)?e.stack:e), 'error', 'Wegas.TabView');
            }
            
        },
        _renderToolbar: function() {
            var panelNode = this.get('panelNode');
			
            panelNode.addClass('wegas-tab-hastoolbar');
            panelNode.prepend('<div class="yui-editor-container wegas-tab-toolbar"><div class="first-child"><div></div></div></div><div style="clear:both"></div>');	
        
            this._toolbar = new YAHOO.widget.Toolbar(panelNode.one('.yui-editor-container')._node.firstChild.firstChild, {
                buttonType: 'advanced',
                draggable: false,
                buttons: this.get('toolbarButtons')
            // collapse:, cont:, disabled:,  grouplabels:, titlebar: "test",
            });
            if (this.get('toolbarLabel')) {
                panelNode.one('.yui-toolbar-subcont').setContent('<span class="title">'+this.get('toolbarLabel')+'</span></div>');
            }
            this._toolbar.on('buttonClick', function(e) {
                var button = this._toolbar.getButtonByValue(e.button.value);		// We have a button reference
               
                switch (button.get('value')) {
                    case 'selectplayer':
                        var p = Y.Wegas.app.dataSources.Game.rest.getPlayerById(e.button.value);
                        button.set('label', p.name);
                        Y.Wegas.app.set('currentPlayer', e.button.value );
                        break;
                    case 'reset':
                        Y.Wegas.app.dataSources.VariableDescriptor.rest.getRequest('reset');
                        break;
                    case 'new': {                                               // New button click event
                        Y.Wegas.editor.edit({
                            "@class": e.button.data['@class']
                        }, function(cfg) {
                            Y.Wegas.app.dataSources[e.button.data['dataSource']].rest.post(cfg);
                        }, null, this);
                        break;
                    }
                }
            }, null, this);
            
            Y.Wegas.app.dataSources.Game.after("response", function(e) {
                var buttons = this._toolbar.getButtons(),
                menu, button, currentPlayerId, i=0, j, k, cGame;
                if (!buttons) return;
                
                for (; i<buttons.length; i++) {
                    button = buttons[i];
                    switch (button.get('value')) {
                        case 'selectplayer':
                            //if (button.getMenu().getItems().length == 0) return;
                            currentPlayerId = Y.Wegas.app.get('currentPlayer');
                            cGame = Y.Wegas.app.dataSources.Game.rest.getCurrentGame();
                            
                            menu = button.getMenu();
                            menu.clearContent();
                            for (j=0; cGame.teams && j<cGame.teams.length; j++) {
                                for (k=0; k<cGame.teams[j].players.length; k++){
                                    menu.addItem({
                                        'text': cGame.teams[j].players[k].name, 
                                        'value': cGame.teams[j].players[k].id
                                    });
                                }
                            }
                            menu.render();
                            break;
                    }
                }
                
                Y.Wegas.app.dataSources.VariableDescriptor.sendRequest({
                    request: ""
                });
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