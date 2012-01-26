/** 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-list', function(Y) {
    
    var Lang = Y.Lang,
    BOUNDINGBOX = 'boundingBox',
    CONTENTBOX = 'contentBox',
    List = Y.Base.create("wegas-list", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget ], {

        syncUI: function() {
            var cb = this.get(CONTENTBOX),
            bb = this.get(BOUNDINGBOX);
            if (this.get('direction') == 'vertical') {
                cb.addClass(this.getClassName('vertical'));
                cb.removeClass(this.getClassName('horizontal'));
            } else {
                cb.addClass(this.getClassName('horizontal'));
                cb.removeClass(this.getClassName('vertical'));
            }
                bb.append('<div style="clear:both"></div>');
        }
        //CONTENT_TEMPLATE : "<ul></ul>",
	/*
	bindUI: function() {

	    if (this.isRoot()) {
		this.get(BOUNDINGBOX).plug(Y.Plugin.NodeFocusManager, {
		    descendants: ".yui3-option",
		    keys: {
			next: "down:40",    // Down arrow
			previous: "down:38" // Up arrow 
		    },
		    circular: true
		});
	    }

	    this.get(BOUNDINGBOX).on("contextmenu", function (event) {
		event.preventDefault();
	    });

	    // Setup listener to control keyboard based single/multiple item selection
	    this.on("option:keydown", function (event) {

		var item = event.target,
		domEvent = event.domEvent,
		keyCode = domEvent.keyCode,
		direction = (keyCode == 40);

		if (this.get("multiple")) {
		    if (keyCode == 40 || keyCode == 38) {
			if (domEvent.shiftKey) {
			    this._selectNextSibling(item, direction);
			} else {
			    this.deselectAll();
			    this._selectNextSibling(item, direction);
			}
		    }
		} else {
		    if (keyCode == 13 || keyCode == 32) {
			domEvent.preventDefault();
			item.set("selected", 1);
		    }
		}
	    });

	    // Setup listener to control mouse based single/multiple item selection
	    this.on("option:mousedown", function (event) {

		var item = event.target,
		domEvent = event.domEvent,
		selection;

		if (this.get("multiple")) {
		    if (domEvent.metaKey) {
			item.set("selected", 1);
		    } else {
			this.deselectAll();
			item.set("selected", 1);
		    }
		} else {
		    item.set("selected", 1);
		}

	    });
	}*/

	/*/ Helper Method, to find the correct next sibling, taking into account nested ListBoxes    
	_selectNextSibling : function(item, direction) {

	    var parent = item.get("parent"),
	    method =  (direction) ? "next" : "previous",

	    // Only go circular for the root listbox
	    circular = (parent === this),
	    sibling = item[method](circular);

	    if (sibling) {
		// If we found a sibling, it's either an Option or a ListBox
		if (sibling instanceof Y.ListBox) {
		    // If it's a ListBox, select it's first child (in the direction we're headed)
		    sibling.selectChild((direction) ? 0 : sibling.size() - 1);
		} else {
		    // If it's an Option, select it
		    sibling.set("selected", 1);
		}
	    } else {
		// If we didn't find a sibling, we're at the last leaf in a nested ListBox
		parent[method](true).set("selected", 1);
	    }
	},

	NESTED_TEMPLATE : '<li id="{liId}-container" class="{nestedOptionClassName}"></li>',

	renderUI: function () {

	    if (this.get("depth") > -1) {

		var boundingBox = this.get(BOUNDINGBOX),
		tokens = {
		    nestedOptionClassName : this.getClassName("container"),
		    liId : boundingBox.get('id')
		},
		liHtml = Y.substitute(this.NESTED_TEMPLATE, tokens),
		li = Y.Node.create(liHtml),
		parent = boundingBox.get("parentNode");

		li.appendChild(boundingBox);
		parent.appendChild(li);
	    }
	},*/
    }, { 
        ATTRS : {
            defaultChildType: {  
                value: "Text"
            },
            direction: {
                value: 'vertical'
            },
            classTxt: {
                value: 'List'
            },
            type: {
                value: "List"
            }
        }
    });
    
    Y.namespace('Wegas').List = List;
});