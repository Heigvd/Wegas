/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('alba-widget', function(Y) {

	var CONTENTBOX = "contentBox",
		BOUNDINGBOX = "boundingBox",
		Lang = Y.Lang,
        Widget = Y.Widget,
        Node = Y.Node;
	/*
    function AlbaWidget(config) {
        AlbaWidget.superclass.constructor.apply(this, arguments);
    }
    AlbaWidget.NAME = "alba-widget";
    Y.extend(AlbaWidget, Widget, {
        initializer: function() {
        },
        destructor : function() {
        },
        renderUI : function() {
        },
        bindUI : function() {
        },
		
		syncUI: function() {
			this.get(BOUNDINGBOX).addClass(this.get('cssClass'));
		}
    });
	
	Y.AlbaWidget = AlbaWidget;*/
	
	function AlbaWidgetMod() {
		/*this.publish("as:select", {
			emitFacade: false
		});
		this.publish("reload", {
			emitFacade: false
		});
		this.publish("success"
			//	, { 
			//   defaultTargetOnly: true,
			//    defaultFn: this._defAddChildFn 
			// }
		);*/
		Y.after(this._syncUIAlba, this, "syncUI");
		Y.before(this._renderUIAlba, this, "renderUI");
	}
	
    AlbaWidgetMod.NAME = "alba-widgetmod";
	AlbaWidgetMod.ATTRS = {
		cssClass: {
			value: ''
		},
        editForm: {
            /*value:	[],
			setter: function (val) {
				
				var returnVal = Y.Attribute.INVALID_VALUE,
					FnConstructor = Lang.isString(val) ? Y[val] : val;
				
				if (Lang.isFunction(FnConstructor)) {
					returnVal = FnConstructor;
				}
				
				return returnVal;
			}*/
        },
		type: {},
		classTxt: {}
	};
	
	AlbaWidgetMod.prototype = {
		_currentCssClass: null,
		recursiveSyncUI: function() {
			this.syncUI();
			if (this.each) {
				this.each(function(w) {
					w.recursiveSyncUI();
				});
			}
		},
		/*
		hideReloadOverlay: function(){
			this._overlay.hide();
		},
	
		showReloadOverlay: function(){
			var bb = this.get('boundingBox');

			if (!this._overlay) {
				this._overlay = Y.Node.create('<div class="yui3-redcms-loading-overlay"><div></div></div>');
				bb.prepend(this._overlay);
			}
			this._overlay.one('div').setStyle('height', bb.getComputedStyle('height'));
			this._overlay.show();
		},*/
		_renderUIAlba: function() {
			this.get(BOUNDINGBOX).addClass('yui3-alba-widget');
		},
		_syncUIAlba:function() {
			if (this._currentCssClass) this.get(BOUNDINGBOX).removeClass(this._currentCssClass);
			this.get(BOUNDINGBOX).addClass(this.get('cssClass'));
			this._currentCssClass = this.get('cssClass');
		}
	};

	Y.AlbaWidgetMod = AlbaWidgetMod;
	
    /* Plugin Constructor */
    function ASWidgetEdit(config) {
        ASWidgetEdit.superclass.constructor.apply(this, arguments);
    }

	
	ASWidgetEdit._overlayInstance = null;
	ASWidgetEdit._menuOverlay = null;
	ASWidgetEdit._menu = null;
	ASWidgetEdit._timer;
    /* 
     * The namespace for the plugin. This will be the property on the widget, which will 
     * reference the plugin instance, when it's plugged in
     */
    ASWidgetEdit.NS = 'as';
    /*
     * The NAME of the WidgetIO class. Used to prefix events generated
     * by the plugin class.
     */
    ASWidgetEdit.NAME = 'ASWidgetEdit';
    /*
     * The className to apply to the contentBox while loading.
     */
    ASWidgetEdit.LOADING_CLASS_NAME = Y.Widget.getClassName('loading');
    ASWidgetEdit.ATTRS = {
        uri: {
            value:null
        },
        cfg: {
            value:null
        },
        formatter: {
            valueFn: function() {
                //return this._defFormatter;
            }
        }
    };

    /* Extend the base plugin class */
    Y.extend(ASWidgetEdit, Y.Plugin.Base, {
		initializer: function(config) { 
			this.afterHostEvent('render', function() {
				this._initOverlay();
				this._initMouseListeners();
			});
		},
        destructor: function() {
        },
        setContent: function(content) {
        },
		_initMouseListeners: function() {
			var cb = this.get('host').get(CONTENTBOX);
			 
			/*cb.on('mouseover', function() {
				this._initOverlay();
				console.log('mouseover'+cb._node.id);
			}, this);
			
			cb.on('mouseout', function() {
				ASWidgetEdit._overlayInstance.hide();
				console.log('mouseout'+cb._node.id);
			}, this);*/
		},
		/*_initMenu: function() {
			if (this._menu) return;
			this._menu = new YAHOO.widget.Menu("as-editmenu", { }); 
		},*/
		_clearTimer: function(){
			if (ASWidgetEdit._timer) {
				ASWidgetEdit._timer.cancel();
				ASWidgetEdit._timer = null;
			}
		},
		_hideOverlay: function() {
			this._clearTimer();
			ASWidgetEdit._timer = Y.later(50, overlay, overlay.hide);
		},
		_showOverlay: function(node) {
			this._clearTimer();
			overlay.get(BOUNDINGBOX).appendTo(node);
			overlay.show();
			overlay.align(node, ["tl", "tl"]);
			//overlay.set('height', e.target.getComputedStyle('height'));
			//overlay.set('width', e.target.getComputedStyle('width'));
		},
		_initOverlay: function() {
			
			if (ASWidgetEdit._overlayInstance) return;
			
			var Alignable = Y.Base.create("asadmin-editoverlay", Y.Widget, [Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack]),
				cb = this.get('host').get(CONTENTBOX);
				overlay = new Alignable({ zIndex: 1	});
			
			ASWidgetEdit._overlayInstance = overlay;
			overlay.get(CONTENTBOX).set("innerHTML", '<div class="yui3-asadmin-move"></div><div class="yui3-asadmin-edit"></div>');
			overlay.render();
			
			//Y.one('body').delegate('mouseover', function(e){
			Y.one('body').delegate('mouseenter', function(e){
				e.currentTarget.addClass("yui3-asadmin-over");
				e.currentTarget.setStyle("border", "1px solid pink");
				this._showOverlay(e.currentTarget);
				e.halt();
			}, '.as-widget', this);
			
			//Y.one('body').delegate('mouseout', function(e){
			Y.one('body').delegate('mouseleave', function(e){
				this._hideOverlay();
				e.currentTarget.removeClass("yui3-asadmin-over");
				ASWidgetEdit._menuOverlay.hide();
				ASWidgetEdit._menu.hide();
				
				var a = e.currentTarget.ancestor('.yui3-asadmin-over');
				if (a) this._showOverlay(a);
				
				e.halt();
			}, '.as-widget', this);
			
			overlay.get(CONTENTBOX).one('.yui3-asadmin-edit').on('click', function(e){
				var menuItems = [],
					targetWidget = Y.Widget.getByNode(e.currentTarget.ancestor('.as-widget'));
				
				if (targetWidget.get('adminMenu')) {
					Y.Array.some( targetWidget.get('adminMenu'), function(item, index, adminMenuConfig) {
						menuItems.push({text: item.label});
					}, this);
					
					ASWidgetEdit._menu.clearContent();
					ASWidgetEdit._menu.addItems(menuItems);
					ASWidgetEdit._menu.render();
					ASWidgetEdit._menu.show();
					
					ASWidgetEdit._menuOverlay.get(BOUNDINGBOX).appendTo(targetWidget.get(CONTENTBOX));
					ASWidgetEdit._menuOverlay.align(e.currentTarget, ['tl', 'bl']);
				}
			}, this);
			
			// Create the menu
			ASWidgetEdit._menuOverlay = new Alignable({
				render: true,
				visible: true,
				zIndex: 1
			});
			ASWidgetEdit._menu = new YAHOO.widget.Menu("as-editmenu", { 
				visible: true, 
				position: 'static',  
				hidedelay: 100 
			}); 
			ASWidgetEdit._menu.render(ASWidgetEdit._menuOverlay.get(CONTENTBOX));			
		}
    });

    Y.namespace('AlbaSIM').ASWidgetEdit = ASWidgetEdit;
	
	
	function AlbaStateMachines(config) {
        s.superclass.constructor.apply(this, arguments);
    }
    AlbaStateMachines.NS = 'alba';
    AlbaStateMachines.NAME = 'AlbaStateMachines';
    AlbaStateMachines.ATTRS = {
		classTxt: { value: 'Stories' },
		type: {value: "AlbaStateMachine"}
    };
    Y.extend(AlbaStateMachines, Y.Base);
	Y.AlbaStateMachines = AlbaStateMachines;
	
	function AlbaStateMachine(config) {
        AlbaStateMachine.superclass.constructor.apply(this, arguments);
    }
    AlbaStateMachine.NS = 'alba';
    AlbaStateMachine.NAME = 'AlbaStateMachine';
    AlbaStateMachine.ATTRS = {
		classTxt: { value: 'Story' },
		type: {value: "AlbaStateMachine"}
    };
    Y.extend(AlbaStateMachine, Y.Base);
	Y.AlbaStateMachine = AlbaStateMachine;
	
    function AlbaState(config) {
        AlbaState.superclass.constructor.apply(this, arguments);
    }
    AlbaState.NS = 'alba';
    AlbaState.NAME = 'AlbaState';
    AlbaState.ATTRS = {
		classTxt: { value: 'Story node' },
		type: {value: "AlbaState"}
    };
    Y.extend(AlbaState, Y.Base);
	Y.AlbaState = AlbaState;
	
	
	function AlbaPage(config) {
        AlbaTransition.superclass.constructor.apply(this, arguments);
    }
    AlbaPage.NS = 'alba';
    AlbaPage.NAME = 'AlbaPage';
    AlbaPage.ATTRS = {
		classTxt: { value: 'Page' },
		type: {value: "AlbaPage"}
    };
    Y.extend(AlbaPage, Y.Base);
	Y.AlbaPage = AlbaPage;
	
	
	function AlbaPages(config) {
        AlbaTransition.superclass.constructor.apply(this, arguments);
    }
    AlbaPages.NS = 'alba';
    AlbaPages.NAME = 'AlbaPages';
    AlbaPages.ATTRS = {
		classTxt: { value: 'Pages' },
		type: {value: "AlbaPages"}
    };
    Y.extend(AlbaPages, Y.Base);
	Y.AlbaPages = AlbaPages;
	
	function AlbaSubpages(config) {
        AlbaTransition.superclass.constructor.apply(this, arguments);
    }
    AlbaSubpages.NS = 'alba';
    AlbaSubpages.NAME = 'AlbaSubpages';
    AlbaSubpages.ATTRS = {
		classTxt: { value: 'Subpages' },
		type: {value: "AlbaSubpages"}
    };
    Y.extend(AlbaSubpages, Y.Base);
	Y.AlbaSubpages = AlbaSubpages;
	
	 function AlbaTransition(config) {
        AlbaTransition.superclass.constructor.apply(this, arguments);
    }
    AlbaTransition.NS = 'alba';
    AlbaTransition.NAME = 'AlbaTransition';
    AlbaTransition.ATTRS = {
		classTxt: { value: 'Transition' },
		type: {value: "AlbaTransition"}
    };
    Y.extend(AlbaTransition, Y.Base);
	Y.AlbaTransition = AlbaTransition;
	
	function AlbaVariable(config) {
        AlbaVariable.superclass.constructor.apply(this, arguments);
    }
    AlbaVariable.NS = 'alba';
    AlbaVariable.NAME = 'AlbaVariable';
    AlbaVariable.ATTRS = {
		classTxt: { value: 'Variable display' },
		type: {value: "AlbaVariable"}
    };
    Y.extend(AlbaVariable, Y.Base);
	Y.AlbaVariable = AlbaVariable;
});
