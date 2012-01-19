/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-widget', function(Y) {
    var Lang = Y.Lang,
    CONTENTBOX = 'contentBox';
    
    function Widget() {

    /*this.publish("redcms:select", {
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
    }

    Widget.ATTRS = {

    };
    Widget.create = function(config) {
	var type = config.childType || config.type,
	child,
	Fn;

	if (type) {
	    Fn = Lang.isString(type) ? Y.WeGAS[type] : type;
	}

	if (Lang.isFunction(Fn)) {
	    child = new Fn(config);
	} else {
	    Y.error("Could not create a child instance because its constructor is either undefined or invalid.");
	}

	return child;
    }

    Widget.prototype = {
    /*   _overlay: null,

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
            }*/
    };

    Y.namespace('WeGAS').Widget = Widget;
    
    
    
    
    /**
     * FIXME We override this function so widget are looked for in WeGAS ns.
     */
    Y.WidgetParent.prototype._createChild = function (config) {

	var defaultType = this.get("defaultChildType"),
	altType = config.childType || config.type,
	child,
	Fn,
	FnConstructor;

	if (altType) {
	    Fn = Lang.isString(altType) ? Y.WeGAS[altType] : altType;
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
        
    }
    
    
    var CometFrame = Y.Base.create("wegas-cometframe", Y.Widget, [Y.WidgetChild, Y.WeGAS.Widget], {
	renderUI: function () {
	    var cb = this.get(CONTENTBOX),
            cometFrameUrl = '/Wegas/cs?'+Y.WeGAS.App.genId()
	    cb.setContent('<div id="comet-reply"></div>'+
		'<iframe id="comet-frame" style="display: none;" src="'+cometFrameUrl+'"></iframe>');
	  
	    window.app = {
		listen: function() {
		    Y.one('#comet-frame').src = cometFrameUrl;
		}, 
		update: function(data) {
		    Y.one('#comet-reply').insert(data.name + ':' + data.message+'<br />');
		},
		updateRaw: function(data) {
		    Y.one('#comet-reply').insert(data+'<br /><br />');	    
		}
	    }
	}
    }, {
	ATTRS : {
	    classTxt: {
		value: 'CometFrame'
	    },
	    type: {
		value: "CometFrame"
	    }
	}
    });
    
    Y.namespace('WeGAS').CometFrame = CometFrame;
    
});
