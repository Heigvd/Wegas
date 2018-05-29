/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/*global YUI*/
YUI.add('wegas-panel-pageloader', function(Y) {
    'use strict';
    /**
     * Open a panel with a page in it.
     * @type {OpenPanelPageloader}
     */
    Y.Plugin.OpenPanelPageloader = Y.Base.create(
        'wegas-panel-pageloader',
        Y.Plugin.Action,
        [],
        {
            execute: function() {
                new Y.Wegas.Panel({
                    children: [
                        new Y.Wegas.PageLoader({
                            pageId: this.get('page'),
                            cssClass: 'wegas-panel-pageloader',
                            pageLoaderId: 'Modalpageloader' + Y.Lang.now()
                        })
                    ],
                    width: this.get('width'),
                    height: this.get('height'),
                    modal: this.get('modal')
                }).render();
            }
        },
        {
            NS: 'wegaspanelpageloader',
            ATTRS: {
                page: {
                    type: 'string',
                    view: {
                        label: 'Popup page',
                        type: 'pageselect'
                    }
                },
                width: {
                    value: '80%',
                    type: 'string',
                    view: { label: 'Width' }
                },
                height: {
                    value: '80%',
                    type: 'string',
                    view: { label: 'Height' }
                },
                modal: {
                    value: true,
                    type: 'boolean',
                    view: { label: 'Modal' }
                }
            }
        }
    );
});
