
/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-logger', function(Y) {
    var CONTENTBOX = 'contentBox',
    
    
    Logger = Y.Base.create("wegas-logger", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
	
	_console: null,
	
	renderUI: function () {
            var node = Y.Node.create('<div style="height:50px"></div>');
           
            
            this.get(CONTENTBOX).appendChild(node);
            
	    this._console = new Y.Console({ 
		logSource: Y.Global,
		plugins: [ Y.Plugin.ConsoleFilters ],
		width: '100%',
		/*height: '300px',*/
		style: 'block'						//'inline'
		//height: '98%',
		//newestOnTop: false,
		//logLevel :'log'
	    }).render(node);
	    Y.log('renderUI()', 'log', "Wegas.Logger");
	}
    }, {
	ATTRS : { }
    });
    
    Y.namespace('Wegas').Logger = Logger;
});