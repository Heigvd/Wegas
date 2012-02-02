/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-tabview', function(Y) {
    var Lang = Y.Lang,
    YAHOO = Y.YUI2,
    
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
            
            // if (this.get('toolbarButtons')) {
            this._renderToolbar();
            //}
            
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
                // collapse:, cont:, disabled:,  grouplabels:, titlebar: "test",
                buttons: this.get('toolbarButtons')
            });
            if (this.get('toolbarLabel')) {
                panelNode.one('.yui-toolbar-subcont').setContent('<span class="title">'+this.get('toolbarLabel')+'</span></div>');
            }
            this._toolbar.on('buttonClick', function(e) {
                var button = this._toolbar.getButtonByValue(e.button.value);		// We have a button reference
                //button.set('menu', ["test"]);						
                // toolbar.deselectAllButtons();
                //toolbar.selectButton(_button);
                // status.innerHTML = 'You clicked on ' + _button.get('label') + ', with the value of ' + ((info.button.color) ? '#' + info.button.color + ' : ' + info.button.colorName : info.button.value);
            
                switch (button.get('value')) {
                    case 'selectuser':
                        var newUser = Y.Wegas.app.dataSources.User.rest.getCachedVariableBy('name', e.button.value);
                        Y.Wegas.app.set('currentUserId', newUser.id )
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
            
            Y.Wegas.app.dataSources.User.after("response", function(e) {
                var buttons = this._toolbar.getButtons(),
                menu = [],
                button;
                if (!buttons) return;
                
                for (var i=0; i<buttons.length; i++) {
                    button = buttons[i];
                    switch (button.get('value')) {
                        case 'selectuser':
                            //if (button.getMenu().getItems().length == 0) return;
                            var currentUserId = Y.Wegas.app.get('currentUserId'),
                            menu = button.getMenu(),
                            k = 0;
                                
                            for (;k< menu.getItems().length;k++) {
                            //  menu.removeItem(0);
                            }
                            /*
                            button.getMenu().addItem( {
                                "text": "eee",
                                "value": 1
                               // "checked": "true"
                            });*/
                            /*                            for (var j in e.response.results) {
                                var u = e.response.results[j];
                                menu.addItem({
                                    "text": u.name,
                                    "value": u.id,
                                    "checked": false
                                });
                            }*/
                            // button.set('menu', menu);
                            //for (Y.Wegas.app.dataSources.User.getCached)
                            /*   button.set('type', {
                                "type": "menu", 
                                "label": "fx", 
                                "value": "selectuser", 
                                "menu": menu
                            });*/
                            //button.getMenu().render();
                           
                                
                            /*    button.getMenu().addItems([ 
                            {
                                text: "Four", 
                                value: 4
                            }, 
                            {
                                text: "Five", 
                                value: 5
                            } 
                            ]);*/
                            // button.getMenu().render();
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