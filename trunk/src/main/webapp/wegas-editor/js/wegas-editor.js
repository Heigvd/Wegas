/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor', function(Y) {
    var	CONTENT_BOX = 'contentBox',
    
    Editor = Y.Base.create("wegas-editor", Y.Wegas.App, [], {
	
        _tab: null,
        _form: null,
        initializer: function(){
            Y.Wegas.editor = this;
        },
        destructor : function(){
        },
	
        /*********************************************************************** INITIALIZE EDITION TAB */
        edit: function(data, callback, formFields, scope) {
            
            var widget = Y.Widget.getByNode('#rightTabView')
            // var widget = Y.Widget.getByNode('#centerTabView'),
            if (!this._tab) {
                this._tab = widget.add({
                    type: "Tab",
                    label: "Edit",
                    toolbarLabel: "Edit"
                });
            }
            widget.selectChild(widget.size()-1);
            /* var node = Y.one('#editor-editdisplayarea').one('div');
            node.empty();
            var node = newTab.item(0).get('panelNode').append('<div></div>');
            */
            var node = this._tab.item(0).get('panelNode').one('.yui3-wegas-list-content');
            node.setStyle('padding-right', '5px');
            data = data || {};
	    
            if (!formFields) {
                formFields = Y.Wegas.app.get('forms')[data['@class']]
            }
	    
            if (this._form)  this._form.destroy();
            
            this._form = new Y.inputEx.Form( { 
                fields: formFields,
                buttons: [{
                    type: 'submit', 
                    value: 'Submit'
                }, {
                    type: 'button',
                    value: 'Cancel',
                    onClick: function() {
                        this._form.destroy();
                        widget.remove(newTab.item(0).get('index'));
                        widget.selectChild(0);
                    } 
                }],
                parentEl: node._node,
                onSubmit: function(e) {
                    if ( !this.validate() ) {
                        return;
                    }
                    this.fire("afterValidation");
                    var val = this.getValue();
                    if (val.valueselector) val = val.valueselector;
                    callback.call(scope || this, val);
                /*
                      this._form.destroy();
                    widget.remove(newTab.item(0).get('index'));
                    widget.selectChild(0);
                     */
                }
            });
            this._form.setValue(data);
        }
    });
	
    Y.namespace('Wegas').Editor = Editor;

});