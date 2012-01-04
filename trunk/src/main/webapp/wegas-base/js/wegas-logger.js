
/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-logger', function(Y) {
    var CONTENTBOX = 'contentBox',
    
    
    Logger = Y.Base.create("wegas-logger", Y.Widget, [Y.WidgetChild, Y.WeGAS.Widget], {
	
	_console: null,
	
	renderUI: function () {
	    Y.log('info', "mmm");
	    this._console = new Y.Console({ 
		logSource: Y.Global,
		plugins: [ Y.Plugin.ConsoleFilters ],
		width: '100%',
		height: '600px',
		style: 'block'							//'inline'
		//height: '98%',
		//newestOnTop: false,
		//logLevel :'warn'
	    }).render(this.get(CONTENTBOX));
	    
	    Y.log('info', "mmm");
	}
    }, {
	ATTRS : { }
    });
    
    Y.namespace('WeGAS').Logger = Logger;
});