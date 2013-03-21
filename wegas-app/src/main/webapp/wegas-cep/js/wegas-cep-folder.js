/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-cep-folder', function (Y) {
    "use strict";
    
    var CONTENTBOX = 'contentBox', Folder;
    Folder = Y.Base.create("wegas-cep-folder", Y.Wegas.ItemSelector, [Y.Wegas.Widget], {
        handlers: null,
        initializer: function () {
            this.handlers = {};
        },
        bindUI: function () {
            Folder.superclass.bindUI.apply(this);
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
        },
        syncUI: function () {
            var i, cb = this.get(CONTENTBOX), nodeToRemove = [];
            Folder.superclass.syncUI.apply(this);

            //remove all "previous" node with "leadershiplevel < 1"
            cb.all('.nodeformatter-position').each(function (node) {
                node.all('*').each(function (n) {
                    if (n.getAttribute('data-position') < 0 && n.get('className') === 'previous') {
                        nodeToRemove.push(n);
                    }
                });
            });
            for (i = 0; i < nodeToRemove.length; i += 1) {
                nodeToRemove[i].remove();
            }
        },
        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        ATTRS: {
        }
    });
    Y.namespace('Wegas').CEPFolder = Folder;
});
