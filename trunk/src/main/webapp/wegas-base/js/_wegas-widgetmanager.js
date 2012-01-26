/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-widgetmanager', function(Y) {
    var	CONTENTBOX = 'contentBox',
    WidgetManager;
    
    //Y.JSON.useNativeParse = true;
    
    WidgetManager = function(config) {
	App.superclass.constructor.apply(this, arguments);
    };
    
    WidgetManager = Y.Base.create("widgetmanager", Y.Base, [ ], {
	initializer: function(cfg){
	},
	destructor : function(){
	}
	
    }, {
	ATTRS: {    }
    });
    
    // Y.JSON.useNativeParse = true;
    Y.namespace('Wegas').WidgetManager = WidgetManager;

});