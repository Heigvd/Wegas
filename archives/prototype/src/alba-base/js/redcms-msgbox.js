/* 
Copyright (c) 2011, Francois-Xavier Aeberhard All rights reserved.
Code licensed under the BSD License:
http://redcms.red-agent.com/license.html
*/

YUI.add('redcms-msgbox', function(Y) {
	var MsgBox,

		BOUNDING_BOX = 'boundingBox',
		CONTENT_BOX = 'contentBox',
		
		MSGBOX = 'redcms-msgbox'
		ERROR = 'error',
		WARNING = 'warning',
		SUCCESS = 'success',
		
		getCN = Y.ClassNameManager.getClassName,
		
		CLASSES = {
			warning	: getCN(MSGBOX, WARNING),
			error	: getCN(MSGBOX, ERROR), 
			success : getCN(MSGBOX, SUCCESS)
		};
	
	
	MsgBox = Y.Base.create(MSGBOX, Y.Widget, [], {
		setMessage : function(style, msg) {
			var cb = this.get(CONTENT_BOX),
				bb = this.get(BOUNDING_BOX);

			bb.removeClass(CLASSES.warning);
			bb.removeClass(CLASSES.error);
			bb.removeClass(CLASSES.success);
			
			cb.setContent(msg);
			bb.addClass(style);
			
			this.show();
		}
	}, {
		CLASSES : CLASSES
	} );
	
	Y.namespace('RedCMS').MsgBox = MsgBox;
}, '0.1.1');