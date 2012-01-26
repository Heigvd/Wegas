/** 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-button', function(Y) {
    
    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    
    Button = Y.Base.create("wegas-button", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
       
        initializer: function(cfg) {
        },
        destroyer: function() {
        },
        renderUI: function () {
            		
        },
        bindUI: function() {
            this.get(CONTENTBOX).on('click', function() {
                alert("Click");
            });
        /*
            this.get(CONTENTBOX).on('click', function() {
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
            }, this);*/
        },
        syncUI: function() {
            //Y.AlbaLinkWidget.superclass.syncUI.apply(this, arguments);	
			
            var targetWidget =  Y.Widget.getByNode('#'+ this.get('targetArea'));
				
            //  if (this.get('view') == 'text') {																			// Update the button display
            this.get(CONTENTBOX).setContent("<span>"+this.get('label')+"</span>");
        //  } else {
        // this.get(CONTENTBOX).setContent('<input type="submit" value="'+this.get('label')+'"></input>');
        //  }
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'Button'
            },
            type: {
                value: "Button"
            },
            label: {}
        }
    });
     
    
    Y.namespace('Wegas').Button = Button;
});