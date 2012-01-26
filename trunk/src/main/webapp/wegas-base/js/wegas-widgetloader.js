/** 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-widgetloader', function(Y) {
    
    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    
    WidgetLoader = Y.Base.create("wegas-widgetloader", Y.Widget, [Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget], {
        
        _widgetCfg: null,
        _widget: null,
	
        initializer: function(cfg) {
        },
        destroyer: function() {
        },
        renderUI: function () {
            var request = Y.io(Y.Wegas.app.get('base')+this.get('layourUrl')+'?id='+Y.Wegas.App.genId(), {
                context: this,
                on: {
                    success: function(id, o, args) {
                        Y.log("renderUI().onWidgetReloadContentReceived():"+  o.responseText, 'log', 'Wegas.WidgetLoader');
                        try {
                            this._widgetCfg = Y.JSON.parse(o.responseText);				// Process the JSON data returned from the server
                        } catch (e) {
                            Y.log("renderUI(): JSON parsing failed: "+e.message, 'error', 'Wegas.WidgetLoader');
                            return;
                        }
                        this._widget = Y.Wegas.Widget.create(this._widgetCfg);
                        
                        try {
                            this._widget.render(this.get(CONTENTBOX));
                        } catch (e) {
                            Y.log('renderUI(): Error rendering widget: '+e.stack, 'error', 'Wegas.WidgetLoader');
                        }
                    }
                }
            });
        },
        bindUI: function() {
        },
        syncUI: function() {
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'WidgetLoader'
            },
            type: {
                value: "WidgetLoader"
            },
            layourUrl: {}
        }
    });
     
    
    Y.namespace('Wegas').WidgetLoader = WidgetLoader;
});