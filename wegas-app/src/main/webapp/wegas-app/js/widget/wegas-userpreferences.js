/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-userpreferences", function (Y) {
    "use strict";

    var CONTENTBOX = "contentBox", UserPreferences;

    UserPreferences = Y.Base.create("wegas-userpreferences", Y.Wegas.FormWidget, [], {
        initializer: function () {
            UserPreferences.superclass.initializer.apply(this, arguments);
        },
        renderUI: function () {
            var k, cb = this.get(CONTENTBOX), fieldsToIgnore = [], datasource = Y.Wegas.app.dataSources["User"],
                    entity = datasource.rest.get("currentUser").getMainAccount();
            UserPreferences.superclass.renderUI.apply(this, arguments);
            for (k in entity.toObject()) {
                if (k !== 'firstname' && k !== 'lastname'
                        && k !== 'password' && k !== 'submit') {
                    fieldsToIgnore.push(k);
                }
            }
            this.setForm(entity.toObject(), entity.getFormCfg(fieldsToIgnore));
        },
        bindUI: function () {
            UserPreferences.superclass.bindUI.apply(this, arguments);
            this.on("submit", function (e) {
                this.showOverlay();
                this.sendUpdate();
            }, this);
        },
        syncUI: function () {
            UserPreferences.superclass.syncUI.apply(this, arguments);
        },
        destructor: function () {
            UserPreferences.superclass.destructor.apply(this, arguments);
        },
        sendUpdate: function () {
            var k, updatedAccount, datasource = Y.Wegas.app.dataSources["User"],
                    user = datasource.rest.get("currentUser").getMainAccount().toObject();
            updatedAccount = this.get('form').getValue();
            for (k in user) {
                if (!updatedAccount[k]) {
                    updatedAccount[k] = user[k];
                }
            }
            Y.Wegas.UserFacade.rest.sendRequest({
                request: "/Account/" + updatedAccount.id,
//                headers: {
//                    'Managed-Mode': 'true'
//                },
                cfg: {
                    method: "PUT",
                    data: Y.JSON.stringify(updatedAccount)
                },
                on: {
                    success: Y.bind(function (e) {
                        this.showMessage("success", "Your account had been successfully updated", 4000);
                        this.hideOverlay();
                    }, this),
                    failure: Y.bind(function (e) {
                        this.showMessage("error", e.response.results.message || "Error updating user", 4000);
                        this.hideOverlay();
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
        }
    });

    Y.namespace("Wegas").UserPreferences = UserPreferences;
});