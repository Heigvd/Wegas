/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-displayarea', function(Y) {
    var CONTENTBOX = 'contentBox',
    
    DisplayArea = Y.Base.create("wegas-displayarea", Y.Widget, [Y.WidgetChild, Y.WeGAS.Widget], {
	renderUI: function () {
	    this.get(CONTENTBOX).setContent("Nothing to display here for now.");
	},
	syncUI: function() {
	}
    }, {
	ATTRS : {
	    classTxt: {
		value: 'DisplayArea'
	    },
	    type: {
		value: "DisplayArea"
	    }
	}
    });
    
    Y.namespace('WeGAS').DisplayArea = DisplayArea;
});