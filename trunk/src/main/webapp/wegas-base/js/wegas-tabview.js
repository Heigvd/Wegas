/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-tabview', function(Y) {
    var Lang = Y.Lang,
    
    TabView = Y.Base.create("tabview", Y.TabView , [Y.WidgetChild, Y.WeGAS.Widget], {
	//NESTED_TEMPLATE : '<li id="{liId}-container" class="{nestedOptionClassName}"></li>',
		
	/*renderUI: function () {
			var tokens = {
					nestedOptionClassName : this.getClassName("container"),
					liId : this.get('id')
				},
				liHtml = Y.substitute(this.NESTED_TEMPLATE, tokens),
				li = Y.Node.create(liHtml),
				boundingBox = this.get(BOUNDINGBOX),
				parent = boundingBox.get("parentNode");

			li.appendChild(boundingBox);
			parent.appendChild(li);
		},*/
	//syncUI: function() {
	//}	
	}, {

	    ATTRS : {
		/*tabIndex: {
		    value: -1
		},*/
		classTxt: {
		    value: 'Tabview'
		},
		type: {
		    value: "Tabview"
		}
	    }
	}),
	
    Tab = Y.Base.create("tab", Y.Tab , [Y.WeGAS.Widget/*, Y.WidgetParent*/], {
	//NESTED_TEMPLATE : '<li id="{liId}-container" class="{nestedOptionClassName}"></li>',
		
	/*initializer: function(cfg){
	},*/
	renderUI: function() {
	    Tab.superclass.renderUI.apply(this, arguments);
	    //this._childrenContainer = this.get('panelNode');
	    
	    this.get('panelNode').getContent();
	},
	/*renderUI: function () {
			var tokens = {
					nestedOptionClassName : this.getClassName("container"),
					liId : this.get('id')
				},
				liHtml = Y.substitute(this.NESTED_TEMPLATE, tokens),
				li = Y.Node.create(liHtml),
				boundingBox = this.get(BOUNDINGBOX),
				parent = boundingBox.get("parentNode");

			li.appendChild(boundingBox);
			parent.appendChild(li);
		},*/
	syncUI: function() {
	    Tab.superclass.syncUI.apply(this, arguments);
	    
	    var cWidget = new Y.WeGAS.List({children:this.get('children')});
	    cWidget.render(this.get('panelNode'));
	}	  
	/*_renderChildren: function () {
	    var renderTo = this._childrenContainer || this.get("contentBox");

	    this._childrenContainer = renderTo;

	    this.each(function (child) {
		child.render(renderTo);
	    });
	}*/
    }, {
	ATTRS : {
	  /*  tabIndex: {
		value: -1
	    },*/
	    classTxt: {
		value: 'Tab'
	    },
	    type: {
		value: "Tab"
	    }, 
	    children: {}
	/*    content: {
		setter: function() {
		    
		},
		validator: Lang.isString
	    }*/
	}
    });
	
    Y.namespace('WeGAS').TabView = TabView;
    Y.namespace('WeGAS').Tab = Tab;
});