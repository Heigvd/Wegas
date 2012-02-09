/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-displayarea', function(Y) {
    var CONTENTBOX = 'contentBox',
    
    DisplayArea = Y.Base.create("wegas-displayarea", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
	renderUI: function () {
	    this.get(CONTENTBOX).setContent('<div id="yui_3_5_0pr1_2_1328720468952_4713" class="yui3-widget yui3-wegas-text"><div id="yui_3_5_0pr1_2_1328720468952_4715" class="yui3-wegas-text-content">Welcome to AlbaSIM.</div></div>');
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
    
    Y.namespace('Wegas').DisplayArea = DisplayArea;
});