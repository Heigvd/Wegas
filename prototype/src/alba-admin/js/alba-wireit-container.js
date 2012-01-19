/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('alba-wireit-container', function(Y) {
	
	WireIt.StateContainer = function(options, layer) {
	   this.targetState = options.state;
	   
	   WireIt.StateContainer.superclass.constructor.call(this, options, layer);
	};

	YAHOO.lang.extend(WireIt.StateContainer, WireIt.Container, {
		
		
		targetState: {},
		manager: null,
		_boxNode: null,
		
		/** 
		* @property xtype
		* @description String representing this class for exporting as JSON
		* @default "WireIt.CanvasContainer"
		* @type String
		*/
	   xtype: "WireIt.StateContainer",

		
		/** 
		* @property className
		* @description CSS class name for the container element
		* @default ""WireIt-Container WireIt-CanvasContainer WireIt-StateContainer"
		* @type String
		*/
		className: "WireIt-Container WireIt-CanvasContainer WireIt-StateContainer",
		
		
		/** 
		* @property label
		* @description Label String
		* @default "not set"
		* @type String
		*/
	   label: "not set",

		
		/** 
		* @property width
		* @description initial width of the container
		* @default 200
		* @type Integer
		*/
		width: 200,
		
		synchronize: function() {
			var bodyNode = new Y.Node(this.bodyEl),
				activityNode = bodyNode.one('.alba-map-activity');
			if (this.targetState.active) activityNode.addClass('alba-map-activity-on');
			else activityNode.removeClass('alba-map-activity-on');
		},
		/*remove: function() {
			WireIt.StateContainer.superclass.remove.call(this);
			this._boxNode.destroy();
		},*/
		render: function() {
			WireIt.StateContainer.superclass.render.call(this);
			
			//this.labelField = new inputEx.InPlaceEdit({parentEl: this.bodyEl, editorField: {type: 'string'}, animColors:{from:"#FFFF99" , to:"#DDDDFF"} });
			//this.labelField.setValue(this.label);
			var bodyNode = new Y.Node(this.bodyEl),
				replyCounter = 0;
				
			this._boxNode = Y.Node.create('<div class="albasim-map-state">'+this.targetState.name+'<div class="alba-map-activity"></div></div>');
			bodyNode.append(this._boxNode);
			
			//Add mouseover highlighting
			this._boxNode.on('mouseover', function() {
				this.addClass("albasim-map-over");
			});
			this._boxNode.on('mouseout', function() {
				this.removeClass("albasim-map-over");
			});
			this._boxNode.on('click', function(e, stateNode) {
				if (!this.layer.selectMapNode(stateNode)) return;
				//this.layer.manager.initEditionTab(Config.formFields.state, this.targetState);
			}, this, this._boxNode);
			this.synchronize();
		}
		
	});
}, '0.1.1', {requires:['gallery-outside-events']});