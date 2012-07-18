/**
 *
 * !!!!!! NOT IN USE
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor-menu', function(Y) {
    var CONTENTBOX = 'contentBox',
        EditMenu;

    EditMenu = Y.Base.create("wegas-editor-menu", Y.Widget, [Y.WidgetPosition,  Y.WidgetPositionAlign, Y.WidgetStack], {

        // *** Instance Members *** //
        _currentDataSource: null,
        _currentData: null,

        // *** Lifecycle Methods *** //
        renderUI : function() {
            var cb = this.get(CONTENTBOX);

            this.menu = new Y.YUI2.widget.Menu("as-editmenu", {
                visible: true,
                position: 'static',
                hidedelay: 100,
                shadow: true
            });
            this.menu.render(cb._node);
        },
        bindUI : function () {
            //var bb = this.get(BOUNDINGBOX);
            //bb.on('mouseupoutside', this.hide, this);
            //bb.on('click', this.hide, this);
            this.menu.subscribe("click", this._onMenuClick, null, this);
        },
        showMenu: function(mouseEvent) {
            //this.move(mouseEvent.clientX + Y.DOM.docScrollX(), mouseEvent.clientY + Y.DOM.docScrollY());
            this.show();
        },
        setMenuItems: function(data, dataSource) {
            var menuItems = Y.Wegas.editor.get("editorMenus")[data["@class"]];

            if (!menuItems) {
                Y.log('error', 'Menu items are undefined.', "Wegas.Editor");
            }

            this._currentDataSource = dataSource;
            this._currentData = data;

            this.menu.clearContent();
            this.menu.addItems(menuItems);
            this.menu.render();
        },

        // *** Private Methods *** //
        _onMenuClick: function (p_sType, args) {
            var menuItem = args[1],
            action = menuItem.value;

            switch (action.op) {
            case "addChild":
                Y.Wegas.editor.edit({
                    '@class': action.childClass
                }, function (value) {
                    this._currentDataSource.rest.post(value, this._currentData);
                }, null, this);
                break;
            case "delete":
                this._currentDataSource.rest.deleteObject(this._currentData);
                break;
            case "smeditor":
                Y.Widget.getByNode(".yui3-wegas-statemachineviewer").set("entity", this._currentData); //TODO: create elsewhere
                break;
            }
            this.hide();
        }
    }, {
        CSS_PREFIX: "wegas-editor-menu"
    });

    Y.namespace('Wegas').EditMenu = EditMenu;
});