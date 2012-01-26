/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-text', function(Y) {
    var CONTENTBOX = 'contentBox',
    
    
    Text = Y.Base.create("wegas-text", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
	//NESTED_TEMPLATE : '<li id="{liId}-container" class="{nestedOptionClassName}"></li>',
	//CONTENT_TEMPLATE : "<em></em>",
	//BOUNDING_TEMPLATE : "<li></li>",
	renderUI: function () {
	/*var boundingBox = this.get(BOUNDINGBOX),
				tokens = {
					nestedOptionClassName : this.getClassName("container"),
					liId : boundingBox.get('id')
				},
				liHtml = Y.substitute(this.NESTED_TEMPLATE, tokens),
				li = Y.Node.create(liHtml),
				parent = boundingBox.get("parentNode");

			li.appendChild(boundingBox);
			parent.appendChild(li);*/
	},
	syncUI: function() {
	    //Y.AlbaTextWidget.superclass.syncUI.apply(this, arguments);
	    this.get(CONTENTBOX).setContent(this.get('content'));
	}
    }, {
	ATTRS : {
	    content: { },
	    classTxt: {
		value: 'Text element'
	    },
	    type: {
		value: "AlbaTextWidget"
	    }
	}
    });
    
    Y.namespace('Wegas').Text = Text;
});