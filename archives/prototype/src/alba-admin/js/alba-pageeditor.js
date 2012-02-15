/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('alba-pageeditor', function(Y) {

	var ContextMenu,
		BOUNDINGBOX = 'boundingBox',
		CONTENTBOX = 'contentBox',
		Lang = Y.Lang,
        Widget = Y.Widget,
        Node = Y.Node,
		Alignable = Y.Base.create("alba-alignableoverlay", Y.Widget, [Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack]),	
		ContextMenu = Y.Base.create("alba-contextmenu", Y.Widget, [Y.WidgetPosition, Y.WidgetStack], {
			// *** Instance Members *** //

			// *** Private Methods *** //
			_hide: function() {
				this.hide();
				this.menu.hide();
			},
			// *** Lifecycle Methods *** //
			renderUI : function() {
				var cb = this.get(CONTENTBOX);
				
				this.menu = new YAHOO.widget.Menu("as-editmenu", { 
					visible: true, 
					position: 'static',  
					hidedelay: 100 ,
					shadow: false
				}); 
				this.menu.render(cb._node);	
			},
			bindUI : function() {
				var bb = this.get(BOUNDINGBOX);
				
				bb.on('mouseupoutside', this._hide, this);
				bb.on('click', this._hide, this);
			}
		});
    
	//Y.namespace('RedCMS').ContextMenu = ContextMenu;
	
	
	  /* Plugin Constructor */
    function AlbaEditorPlugin(config) {
        AlbaEditorPlugin.superclass.constructor.apply(this, arguments);
    }
	AlbaEditorPlugin._contextMenu = null;
	AlbaEditorPlugin._timer;
    AlbaEditorPlugin.NS = 'editMenu';
    AlbaEditorPlugin.NAME = 'AlbaEditorPlugin';
    AlbaEditorPlugin.LOADING_CLASS_NAME = Y.Widget.getClassName('loading');
    AlbaEditorPlugin.ATTRS = { };
    /* Extend the base plugin class */
    Y.extend(AlbaEditorPlugin, Y.Plugin.Base, {
		// *** Instance Members *** //
		_currentWidget: null,
		
		// *** Private Methods *** //
		
		
		// *** Lifecycle Methods *** //
		initializer: function(config) { 
			this.afterHostEvent('render', function() {
				this._initOverlays();
				this._initListeners();
			});
		},
        destructor: function() {
        },
		_menuCounter: 0,
		_setMenuItems: function( targetVariable, groupLabel) {
			var menu = AlbaEditorPlugin._contextMenu.menu,
				type = targetVariable.type,
				menuCounter = this._menuCounter;
			
			if (!type) return;
			groupLabel = groupLabel || Y.AlbaSIM.albaEditor._getAdminLabel(targetVariable);
			
			function addMenuItem(menuCfg) {
				var item = menu.addItem(menuCfg, menuCounter);
				if ( menuCfg.submenu ) {
					for (var i=0; i<menuCfg.submenu.itemdata.length; i++ ) {
						if (menuCfg.submenu.itemdata[i].op) {
							var cItem = item.cfg.getProperty("submenu").getItem(i);	
							cItem._action = menuCfg.submenu.itemdata[i];
							cItem.targetVariable = targetVariable;
						}
					}
				} 
				//if (menuCfg.op) {
					item._action = menuCfg;
					item.targetVariable = targetVariable;
				//}
			}
			
			if (Config.adminMenus[type]) {
				Y.Array.each(Config.adminMenus[type], function(menuCfg) {
					if (!(menuCfg.op && menuCfg.op == 'openStateMachine' && targetVariable == Y.AlbaSIM.albaEditor._currentStateMachine)) {
						addMenuItem(menuCfg);
					}
				});
			}
			menu.setItemGroupTitle(groupLabel, this._menuCounter); 
			this._menuCounter++;
		},
		_initListeners: function() {
			var cb = this.get('host').get(CONTENTBOX),
				sortable = new Y.Sortable({																		
					container: cb,
					nodes: 'li',
					opacity: '.2'
				}),
				bb = this.get('host').get(BOUNDINGBOX);
			//cb.delegate('mouseover', function(e){
			cb.delegate('mouseenter', function(e){
				//console.log("over", e.currentTarget.get('id'));
				var targetWidget = Y.AlbaSIM.AlbaManager.getWidgetByNode( e.currentTarget );
				if (targetWidget) {
					this._showOverlay(targetWidget);
				}
				e.halt();
			}, '.yui3-alba-widget', this);
			
			//cb.delegate('mouseout', function(e){
			cb.delegate('mouseleave', function(e){
				//console.log("out", e.currentTarget.get('id'));
				this._hideOverlay();
				e.halt();
				
				var a = Y.AlbaSIM.AlbaManager.getWidgetByNode( e.currentTarget.get('parentNode') );
				if (a && a.get('root') != a) this._showOverlay(a);
			}, '.yui3-alba-widget', this);
			
			cb.on('contextmenu', function(e) {
				var counter = 0,
					currentWidget = Y.Widget.getByNode(e.target),
					menu = AlbaEditorPlugin._contextMenu.menu, item;
				
				this._clearMenu();
				
				while (currentWidget) {
					if (currentWidget.get('type')) {
						var widgetCfg = currentWidget.getAttrs(),
							pageWidgetConfig = Y.AlbaSIM.albaEditor.getPageWidgetCfgById(widgetCfg.id);
							
						pageWidgetConfig.widgetInstance = currentWidget;
						
						this._setMenuItems(pageWidgetConfig);
			
						currentWidget = currentWidget.get('parent');
						counter++;
					} else {
						currentWidget = Y.Widget.getByNode(currentWidget.get(BOUNDINGBOX).get('parentNode'));
					}
				}
				
				this._showEditMenu(e);
			}, this);
		},
		_clearMenu: function() {
			AlbaEditorPlugin._contextMenu.menu.clearContent();
			this._menuCounter = 0;
		},
		_showEditMenu: function(mouseEvent) {
			AlbaEditorPlugin._contextMenu.menu.render();
			AlbaEditorPlugin._contextMenu.menu.show();
			AlbaEditorPlugin._contextMenu.move(mouseEvent.clientX + Y.DOM.docScrollX(), mouseEvent.clientY + Y.DOM.docScrollY());
			AlbaEditorPlugin._contextMenu.show();
		},
		_initOverlays: function() {
			if (AlbaEditorPlugin._contextMenu) return;
			
			this._highlightOverlay = new Alignable({zIndex: 1, render: true, visible: false });								// Init the highlighting overlay
			this._highlightOverlay.get(BOUNDINGBOX).setStyles( { position: 'relative', display:"none" });
			this._highlightOverlay.get(CONTENTBOX).setStyles( { position: 'absolute', width:'100%', opacity: '0.5', height:'20px',
				background: '#2647A0', "pointer-events": "none"
			});
			
			AlbaEditorPlugin._contextMenu = new ContextMenu({ zIndex: 2, render: true, visible: true });					// Init the context menu widget instance
		
			//AlbaEditorPlugin._contextMenu.menu.subscribe("itemAdded", function (p_sType, p_aArgs) { 
				//var oMenuItem = p_aArgs[0];
				//oMenuItem.subscribe("mouseover", this._onMenuItemEvent); 
				//oMenuItem.subscribe("mouseout", this._onMenuItemEvent);
				//oMenuItem.subscribe("click", this._onMenuItemEvent); 
			//}, null, this); 
			
			AlbaEditorPlugin._contextMenu.menu.addItem({text: ".", submenu:{ itemdata:[{text:"."}]}});
			AlbaEditorPlugin._contextMenu.menu.render();
			AlbaEditorPlugin._contextMenu.menu.subscribe("mouseover", this._onContextMenuOver, null, this); 
			AlbaEditorPlugin._contextMenu.menu.subscribe("mouseout", this._onContextMenuOut, null, this); 
			AlbaEditorPlugin._contextMenu.menu.subscribe("click", this._onContextMenuClick, null, this);
			return;		
		},
		_showOverlay: function(targetWidget) {
			var targetNode = targetWidget.get(BOUNDINGBOX);
			
			targetNode.prepend(this._highlightOverlay.get(BOUNDINGBOX));
			this._highlightOverlay.get(BOUNDINGBOX).setStyles( { display: 'block'});
			this._highlightOverlay.get(CONTENTBOX).setStyles({ height: targetNode.getComputedStyle('height') });
			this._highlightOverlay.show();
			//this._highlightOverlay.align(targetNode, ["tl", "tl"]);
			//this._highlightOverlay.set('width', targetNode.getComputedStyle('width'));
		},
		_hideOverlay: function() {
			this._highlightOverlay.hide();
			this._highlightOverlay.get(BOUNDINGBOX).setStyles( { display: 'none'});
		},
		_onContextMenuOver: function(p_sType, args) { 
			var menuItem = args[1];
			if (menuItem && menuItem.targetVariable && menuItem.targetVariable.widgetInstance) {
				//targetNode.setStyle('background', '#2647A0');
				//targetNode.setStyle('opacity', '0.2');
				this._showOverlay(menuItem.targetVariable.widgetInstance)
			}
		},
		_onContextMenuOut: function(p_sType, args) { 
			this._hideOverlay();
		},
		_onContextMenuClick: function(p_sType, args) { 
			var menuItem = args[1],
				menuId = menuItem.cfg.getProperty('text'),
				action = menuItem._action;
			
			
			if (!action.op) return; 
			
			if (action.op == "delete") {
				if (menuItem.targetVariable.widgetInstance)	menuItem.targetVariable.widgetInstance.destroy();
				Y.AlbaSIM.albaEditor.syncPagesTab();

				this._hideOverlay();
			} else if (action.op == "edit") {
				Y.AlbaSIM.albaEditor.initEditionTab( Config.formFields[action.adminForm], menuItem.targetVariable, function(modifiedAttrs) {
					if (menuItem.targetVariable.widgetInstance) {
						menuItem.targetVariable.widgetInstance.setAttrs(modifiedAttrs);
						menuItem.targetVariable.widgetInstance.syncUI();
					}
					
					for (var i in modifiedAttrs) {
						menuItem.targetVariable[i] = modifiedAttrs[i];
					}
					Y.AlbaSIM.albaEditor.syncStateMachineTab();
					Y.AlbaSIM.albaEditor.syncPagesTab();
					Y.AlbaSIM.albaEditor.syncStatesTab();
				});
				
				this._hideOverlay();
			} else if (action.op == 'addChild') {
				Y.AlbaSIM.albaEditor.initEditionTab( Config.formFields[action.adminForm], null, function(newConfig) {
					if (menuItem.targetVariable.widgetInstance) {
						menuItem.targetVariable.widgetInstance.add(newConfig);
					}
					
					if (!menuItem.targetVariable.children) menuItem.targetVariable.children = [];
					
					menuItem.targetVariable.children.push(newConfig);
					
					Y.AlbaSIM.albaEditor.syncStateMachineTab();
					Y.AlbaSIM.albaEditor.syncPagesTab();
					Y.AlbaSIM.albaEditor.syncStatesTab();
				});
				
				
				this._hideOverlay();
			} else if (action.op = "openStateMachine") {
				Y.AlbaSIM.albaEditor.tabViews[1].selectChild(0);	
				Y.AlbaSIM.albaEditor._currentStateMachine =  menuItem.targetVariable;
				Y.AlbaSIM.albaEditor.syncStateMachineTab();
			}
		}
    });

    Y.namespace('AlbaSIM').AlbaEditorPlugin = AlbaEditorPlugin;
});
