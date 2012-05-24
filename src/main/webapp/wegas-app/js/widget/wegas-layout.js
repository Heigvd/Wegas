/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-layout', function (Y) {
    "use strict";

    var YAHOO = Y.YUI2, Layout;

    Layout = Y.Base.create("wegas-layout", Y.Widget, [Y.Wegas.Widget], {

	_layout: null,

	renderUI: function () {
	    var units = [
                    {position: 'top', height: 25, body: '', scroll: null, zIndex: 2},
                    {position: 'left', width: 300, resize: true, scroll: true,  body: '', animate: true},	// was 550px
                    {position: 'right', width: 350, resize: true, collapse: false, scroll: true,  body: '', animate: true},
                    {position: 'center', body: ''}
		];

            this._layout = new YAHOO.widget.Layout({units: units});
	    this._layout.on('render', this._onLayoutRender, null, this);

	    this._layout.on('resize', function()  {
                console.log("mmmmmm");
                Y.Wegas.app.fire("layout:resize");
            }, null, this);
	    this._layout.render();
	},
	_onLayoutRender: function () {
	    if (this.get('top')) {this._renderUnitContent('top');}
	    if (this.get('left')) {this._renderUnitContent('left');}
	    if (this.get('center')) {this._renderUnitContent('center');}
	    if (this.get('right')) {this._renderUnitContent('right');}
	    if (this.get('bottom')) {this._renderUnitContent('bottom');}
	},

	_renderUnitContent: function (position) {
	    //var cWidget = Y.Wegas.Widget.create(this.get(position).content);
	    var pos = this.get(position), cWidget;
	    pos.width = null;
	    cWidget = new Y.Wegas.List(pos);
	    cWidget.render(this._layout.getUnitByPosition(position).body)
	}
    }, {
	ATTRS: {
	    left: {},
	    right: {},
	    top: {},
	    bottom: {},
	    center: {}
	}
    });

    Y.namespace('Wegas').Layout = Layout;
});