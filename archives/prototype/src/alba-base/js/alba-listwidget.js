/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('alba-listwidget', function(Y) {

	var Lang = Y.Lang,
		BOUNDINGBOX = 'boundingBox',
		CONTENTBOX = 'contentBox';
	/*
	function WidgetParent(config) {
		WidgetParent.superclass.constructor.apply(this, arguments);
	}
	
	Y.extend(WidgetParent, Y.WidgetParent, {
		_createChild: function (config) {

			var defaultType = this.get("defaultChildType"),
				altType = config.childType || config.type,
				child,
				Fn,
				FnConstructor;

			if (altType) {
				Fn = Lang.isString(altType) ? Y[altType] : altType;
			}

			if (Lang.isFunction(Fn)) {
				FnConstructor = Fn;	
			} else if (defaultType) {
				// defaultType is normalized to a function in it's setter 
				FnConstructor = defaultType;
			}

			if (FnConstructor) {
				child = new FnConstructor(config);
			} else {
				Y.error("Could not create a child instance because its constructor is either undefined or invalid.");
			}

			return child;
			
		},
	})
	Y.AlbaSIM.WidgetParent = WidgetParent;*/

	Y.AlbaListWidget = Y.Base.create("alba-listwidget", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.AlbaWidgetMod ], {

		CONTENT_TEMPLATE : "<ul></ul>",

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
		},

		// Helper Method, to find the correct next sibling, taking into account nested ListBoxes    
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
		},
		syncUI: function() {
			var cb = this.get(CONTENTBOX),
				bb = this.get(BOUNDINGBOX);
			if (this.get('direction') == 'vertical') {
				cb.addClass(this.getClassName('vertical'));
				cb.removeClass(this.getClassName('horizontal'));
			} else {
				cb.addClass(this.getClassName('horizontal'));
				cb.removeClass(this.getClassName('vertical'));
				bb.append('<div style="clear:both"></div>');
			}
		}
	}, { 
		ATTRS : {
			defaultChildType: {  
				value: "AlbaTextWidget"
			},
			direction: {
				value: 'vertical'
			},
			classTxt: { value: 'List' },
			type: { value: "AlbaListWidget" }
		}
	});

	Y.AlbaPageWidget = Y.Base.create("alba-listwidget", Y.AlbaListWidget, [], { }, {
		ATTRS : {
			defaultChildType: {  
				value: "AlbaTextWidget"
			},
			direction: {
				value: 'vertical'
			},
			classTxt: { value: 'Page' },
			type: { value: "AlbaPageWidget" }
		}
	});
	
	Y.AlbaVariableWidget = Y.Base.create("alba-variablewidget", Y.Widget, [Y.WidgetChild, Y.AlbaWidgetMod], {
		BOUNDING_TEMPLATE : "<li></li>",
		
		/*renderUI: function () {
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
		},*/
		syncUI: function() {
			Y.AlbaVariableWidget.superclass.syncUI.apply(this, arguments);
			var evaluatedResult = Y.AlbaSIM.albaEditor.evalScript(this.get("variable"));
			
			if ( this.get('view') == 'text') {
				this.get(CONTENTBOX).setContent(this.get('label')+": "+evaluatedResult);
			} else {
				var acc =[];
				for (var i=0; i<evaluatedResult; i++) {
					acc.push('<div class="yui3-alba-variablewidget-unit"></div>');
				}
				this.get(CONTENTBOX).setContent(this.get('label')+": <br />"+acc.join('')+'('+evaluatedResult+')');
			}
			
		}
	}, {

		ATTRS : {
			label : {
				validator: Y.Lang.isString
			},
			tabIndex: {
				value: -1
			},
			variable: {
			
			},
			view: {
				value: "text"
			},
			classTxt: { value: 'Variable' },
			type: { value: "AlbaVariableWidget" }   
		}
	});
	
	Y.AlbaLinkWidget = Y.Base.create("alba-linkwidget", Y.Widget, [Y.WidgetChild, Y.AlbaWidgetMod], {
	
		BOUNDING_TEMPLATE : "<li></li>",
		//NESTED_TEMPLATE : '<li id="{liId}-container" class="{nestedOptionClassName}"></li>',
		
		renderUI: function () {
			var cb = this.get(CONTENTBOX);
/*				tokens = {
					nestedOptionClassName : this.getClassName("container"),
					liId : bb.get('id')
				},
				liHtml = Y.substitute(this.NESTED_TEMPLATE, tokens),
				li = Y.Node.create(liHtml),
				parent = bb.get("parentNode");

			li.appendChild(bb);
			parent.appendChild(li);*/
			
			cb.on('click', function() {
				var targetWidget =  Y.Widget.getByNode('#'+ this.get('targetArea')),
					subpageCfg = Y.AlbaSIM.albaEditor.getSubpageById(this.get('targetSubpageId'));
					
				if (targetWidget && ! subpageCfg) alert("This input element has a dynamic area where to display but no subpage to display.");
				if (targetWidget && ! subpageCfg) alert("This input element has a subpage to display but no dynamic area to display in.");
									
				//if (!targetWidget && !this.get('isStoryEvent')) { alert("Targeted widget id does not exist and action does not send a story event."); return; };
				
				if (targetWidget && (!targetWidget._sourceWidget || targetWidget._sourceWidget != this)) {
					targetWidget._sourceWidget = this;
					this.syncUI();
				}
				
				//if (this.get('isStoryEvent')) {
					Y.AlbaSIM.albaEditor.throwInputEvent(this.getAttrs());
				//}
			}, this);
		},
		
		_targetSubpageref: null,
		syncUI: function() {	
			//Y.AlbaLinkWidget.superclass.syncUI.apply(this, arguments);	
			
			var targetWidget =  Y.Widget.getByNode('#'+ this.get('targetArea'));
				
			if (this.get('view') == 'text') {																			// Update the button display
				this.get(CONTENTBOX).setContent("<span>"+this.get('label')+"</span>");
			} else {
				this.get(CONTENTBOX).setContent('<input type="submit" value="'+this.get('label')+'"></input>');
			}
			
			if (targetWidget && targetWidget._sourceWidget == this) {													// Update the button childs display area if required
				targetWidget.each(function(w) {																			// Hide others widgets
					w.get(BOUNDINGBOX).setStyle('display', 'none');
				});
				
				if (!this._targetSubpageref) {																			// If required, instantiate the targeted widget
					var subpageId = this.get('targetSubpageId');
					if (subpageId) {
						var subpageCfg = Y.AlbaSIM.albaEditor.getSubpageById(subpageId);
						if (subpageCfg) {
							this._targetSubpageref = targetWidget.add(subpageCfg).item(0);
						}
					} 
					if (!this._targetSubpageref) 
						this._targetSubpageref = targetWidget.add({ type: 'AlbaTextWidget', content: "This link has no sub widgets." }).item(0);  
				}
				
				this._targetSubpageref.get(BOUNDINGBOX).setStyle('display', 'block');									// Show the widget	
			}
		}
	}, {

		ATTRS : {
			label : {
				validator: Y.Lang.isString
			},
			tabIndex: {
				value: -1
			},
			targetArea: { },
			targetSubpageId: { },
			isStoryEvent: { },
			inputAction: { },
			name: { },
			view: {
				value: 'text'
			},
			classTxt: { value: 'Link' },
			type: { value: "AlbaLinkAreaWidget" }
		}
	});
		
	/*function AlbaDisplayAreaWidget() {
		inputEx.superclass.constructor.apply(this, arguments);
	}
	Y.extend(AlbaDisplayAreaWidget, Y.AlbaListWidget, {
		renderUI: function () {	
			Y.AlbaDisplayAreaWidget.superclass.renderUI.apply(this, arguments);
		},
		syncUI: function() { 
			Y.AlbaDisplayAreaWidget.superclass.renderUI.apply(this, arguments);
		},
	}, {
		NAME: 'alba-displayareawidget',
		ATTRS: {
			classTxt: { value: 'Dynamic area' }
		}
	})*/
	
	Y.AlbaDisplayAreaWidget = Y.Base.create("alba-displayareawidget", Y.AlbaListWidget, [], {
		
		testfb: function() {
		
		}
	}, {
		ATTRS : {
			classTxt: { value: 'Dynamic area' },
			type: {value: "AlbaDisplayAreaWidget"}
		}
	});
	
	Y.AlbaTextWidget = Y.Base.create("alba-textwidget", Y.Widget, [Y.WidgetChild, Y.AlbaWidgetMod], {
		//NESTED_TEMPLATE : '<li id="{liId}-container" class="{nestedOptionClassName}"></li>',
		//CONTENT_TEMPLATE : "<em></em>",
		BOUNDING_TEMPLATE : "<li></li>",
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
			tabIndex: {	value: -1 }, 
			content: { },
			classTxt: { value: 'Text element' },
			type: {value: "AlbaTextWidget"}
		}
	});

	
	Y.AlbaTabView = Y.Base.create("alba-tabview", Y.TabView , [Y.WidgetChild, Y.AlbaWidgetMod], {
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
			tabIndex: {	value: -1 },
			classTxt: { value: 'Tabview' },
			type: {value: "AlbaTabView"}		
		}
	});
	
	Y.AlbaTab = Y.Base.create("alba-tab", Y.Tab , [Y.AlbaWidgetMod], {
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
			tabIndex: {
				value: -1
			},
			classTxt: { value: 'Tab' },
			type: {value: "AlbaTab"}	
		}
	});
	
	Y.AlbaProjectTab = Y.Base.create("alba-tab", Y.AlbaTab , [], {
		//NESTED_TEMPLATE : '<li id="{liId}-container" class="{nestedOptionClassName}"></li>',
		
		syncUI: function () {
			Y.AlbaProjectTab.superclass.syncUI.apply(this, arguments);
			this.set('content', '<div class="h2">Description</div>'+
						'<div class="content">'+
							'<div class="h4">'+this.get('label')+'</div>'+
							'<div class="description">'+this.get('text')+'</div>'+
							'<input type="submit" id="alba-pm-action" value="Effectuer cette action"></input>'+
						'</div>');
			this.get('panelNode').one('input').on('click', function() {
				Y.AlbaSIM.albaEditor.throwInputEvent(this.getAttrs());
			}, this);
		}
	}, {
		ATTRS : {
			tabIndex: {
				value: -1
			},     
			text: { },     
			name: { },     
			inputAction: { },
			classTxt: { value: 'AlbaProject tab' },
			type: { value: "AlbaProjectTab" }	
		}
	});
	
});
