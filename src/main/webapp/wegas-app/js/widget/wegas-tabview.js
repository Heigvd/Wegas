/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-tabview', function (Y) {
    "use strict";

    var TabView, Tab;

    TabView = Y.Base.create("tabview", Y.TabView, [Y.WidgetChild, Y.Wegas.Widget], {
        bindUI: function () {
            TabView.superclass.bindUI.apply(this, arguments);

            // @fixme we notify the editor for any change, so widget can be updated
            // this should be done through wiget-parent, widget-child event bubbling
            this.after("selectionChange", function() {
                Y.Wegas.app.fire("layout:resize");
            });
        }
    });


    /**
    * Extension enabling a Tab to be a parent of another Widget.
    *
    * @modified from original WidgetParent module
    *
    * @module widget-parent
    */
    function Parent(config) {

        this.publish("addChild", {
            defaultTargetOnly: true,
            defaultFn: this._defAddChildFn
        });
        this.publish("removeChild", {
            defaultTargetOnly: true,
            defaultFn: this._defRemoveChildFn
        });

        this._items = [];

        var children,
        handle;

        if (config && config.children) {

            children = config.children;

            handle = this.after("initializedChange", function (e) {
                this._add(children);
                handle.detach();
            });

        }

        //  Widget method overlap
        Y.after(this._renderChildren, this, "renderUI");
        Y.after(this._bindUIParent, this, "bindUI");
        //        this.after("selectionChange", this._afterSelectionChange);
        //        this.after("selectedChange", this._afterParentSelectedChange);
        //        this.after("activeDescendantChange", this._afterActiveDescendantChange);

        this._hDestroyChild = this.after("*:destroy", this._afterDestroyChild);
    //        this.after("*:focusedChange", this._updateActiveDescendant);

    }

    Y.mix(Parent, Y.WidgetParent);
    Y.augment(Parent, Y.WidgetParent);
    delete Parent.ATTRS.selected;
    Parent.prototype._renderChildren = function () {
        var renderTo = this._childrenContainer || this.get("panelNode").one(".yui3-tab-panel-content");        // @modified

        this._childrenContainer = renderTo;

        this.each(function (child) {
            child.render(renderTo);
        });
    }
    Parent.prototype._createChild =  Y.WidgetParent.prototype._createChild;


    /**
    * Custom Tab implementation
    */
    Tab = Y.Base.create("tab", Y.Tab, [Y.Wegas.Widget, Parent], {

        // *** Private Fields *** //

        // *** Lifecycle Methods *** //
        renderUI: function () {
            Tab.superclass.renderUI.apply(this, arguments);

            this.renderToolbar();
        },

        // *** Private Methods *** //
        getToolbarNode: function() {
            ;
        },
        renderToolbar: function () {
            var panelNode = this.get('panelNode'),
            toolbarChildren = this.get("toolbarChildren"),
            widget, toolbarNode;

            panelNode.prepend('<div class="wegas-tab-toolbar"></div><div class="yui3-tab-panel-content"></div>');
            toolbarNode = panelNode.one(".wegas-tab-toolbar");

            if (this.get('toolbarLabel')) {
                toolbarNode.setContent('<span class="title">' + this.get('toolbarLabel') + '</span></div>');
            }

            for (var i = 0; i < toolbarChildren.length; i = i + 1) {
                widget = Y.Wegas.Widget.create(toolbarChildren[i]);
                widget.render(toolbarNode);
            }
        }
    }, {
        ATTRS : {
            content: {
                setter: function() { }                                          // Overrides the panelNode management
            },
            toolbarNode: {
                lazyAdd: false,
                value: false,
                getter : function () {
                    return this.get('panelNode').one(".wegas-tab-toolbar");
                }
            },
            toolbarChildren: {
                value: []
            },
            toolbarLabel: {}
        }
    });

    Y.namespace('Wegas').TabView = TabView;
    Y.namespace('Wegas').Tab = Tab;
});