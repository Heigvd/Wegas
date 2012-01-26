/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor', function(Y) {
    var	CONTENT_BOX = 'contentBox',
    
    Editor = Y.Base.create("wegas-editor", Y.Wegas.App, [], {
	
	initializer: function(){
	    Y.Wegas.editor = this;
	},
	destructor : function(){
	},
	
	/*********************************************************************** INITIALIZE EDITION TAB */
	edit: function(data, callback, formFields, scope) {
	    var node = Y.one('#editor-editdisplayarea').one('div');
	    node.empty();
	    
	    data = data || {};
	    
	    if (!formFields) {
		formFields = Y.Wegas.app.get('forms')[data['@class']]
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
	}
    });
	
    Y.namespace('Wegas').Editor = Editor;

});