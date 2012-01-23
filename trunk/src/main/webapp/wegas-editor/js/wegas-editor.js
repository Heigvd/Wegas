/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor', function(Y) {
    var	CONTENT_BOX = 'contentBox',
    
    Editor = Y.Base.create("wegas-editor", Y.Base, [ ], {
	
	initializer: function(cfg){
	    Y.WeGAS.editor = this;
	},
	destructor : function(){
	},
	
	
	
	/*********************************************************************** INITIALIZE EDITION TAB */
	edit: function(data, callback, formFields, scope) {
	    var node = Y.one('#editor-editdisplayarea').one('div');
	    node.empty();
	    
	    data = data || {};
	    
	    if (!formFields) {
		formFields = Y.WeGAS.app.get('forms')[data['@class']]
	    }
	    
	    var cForm = new Y.inputEx.Form( { 
		fields: formFields,
		buttons: [{
		    type: 'submit', 
		    value: 'Submit'
		}],
		parentEl: node._node,
		onSubmit: function(e) {
		    if ( !this.validate() ) {
			return;
		    }
		    this.fire("afterValidation");
		    
		    callback.call(scope || this, this.getValue());
	   	}
	    });
	    cForm.setValue(data);

	  /*  cForm.on('updated', function() { });
	    cForm.on('submit', function(e) {
		console.log(arguments);
		e.halt();
	    });
	/* Y.log("initEditionTab()", "info",  "AlbaEditor");
	    var manager = this;
	    Y.use( "inputex", function(Y) {
		var element = manager.tabViews[2].item(0).get('subpanelNode'),
		form, lastCssClass, label;
					
		manager.tabViews[2].selectChild(0);																// Show edition tab
		element.empty();																				// Clear the current form
					
		if (values) {																					// Sets form label
		    label = 'Edit '+ manager._getAdminLabel(values);
		} else {
		    var typeField = Y.Array.find(formFields, function(el) {
			return el.name == 'type'
		    });
		    label = 'Add '+Y[typeField.value].ATTRS.classTxt.value
		}
				
		Y.Array.each(formFields, function(field) {
					
		    if (!field.typeInvite && !field.required) field.typeInvite = 'optional'; 
				
		    if (field.metatype) {
			if (field.metatype == 'subpageselect') {
			    field.type = 'select';
			    field.choices = [ {
				value: null, 
				label: 'Not selected'
			    }];
			    Y.Array.each(this._currentPageCfg.data.subpages.children, function(sub) {
				field.choices.push( {
				    value: sub.id, 
				    label: this._getAdminLabel(sub)
				});
			    }, this);
			}
			if (field.metatype == 'widgetselect') {
			    field.type = 'select';
			    field.choices = [ {
				value: null, 
				label: 'Not selected'
			    }];
			    Y.Array.each(field.targetType.split(','), function(type) {
				Y.Array.each(this.getPageWidgetsCfgByType(type), function(sub) {
				    field.choices.push( {
					value: sub.id, 
					label: this._getAdminLabel(sub)
				    });
				}, this);
			    }, this);
			}
						
		    }
		}, manager);
					
		function showFormMsg(cssClass, msg) {															// Form msgs logic
		    var msgNode = element.one('.yui3-alba-formmsg');
		    if (lastCssClass) msgNode.removeClass('yui3-alba-formmsg-'+lastCssClass);
		    msgNode.addClass('yui3-alba-formmsg-'+cssClass);
		    msgNode.setStyle('display', 'block');
		    msgNode.one('.yui3-alba-formmsg-content').setContent(msg);
		    lastCssClass = cssClass;
		}
		element.append('<div class="yui3-alba-formtitle">'+label+'</div>'
		    +'<div class="yui3-alba-formmsg"><span class="yui3-alba-formmsg-icon"></span><span class="yui3-alba-formmsg-content"></span></div>');
				
		form = new inputEx.Form( { 
		    parentEl: element._node,
		    fields: formFields,
		    buttons: [{
			type: 'submit', 
			value: 'Update',
			onClick: function(e) { 
			    if (form.validate()) {							
				try {
				    callback(form.getValue(), e);
				    showFormMsg('success', 'Form submission successful.');
				} catch (e) {
				    alert("Exception evaluating form callback");
				}
			    } else {
				showFormMsg('error', 'Please fill all form fields correctly.');
			    }
			    return false; 																		// stop clickEvent, to prevent form submitting           
			} 
		    }]
		});
				
		var idFormField = form.getFieldByName('id');													// FIXME fine tune elements, should be in new objects
		if (idFormField) {
		    if (values.id) idFormField.disable()
		};
				
		//FIXME hack so inputex render html area before setting values
		if (values) {
		    Y.later(200, this, function() {
			form.setValue(values);
		    });
		}
	    });*/
	}
    }, {
	ATTRS: {
    }	
    });
	
    Y.namespace('WeGAS').Editor = Editor;

});