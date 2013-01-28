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
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-userpreferences", function (Y) {
    "use strict";

    var UserPreferences = Y.Base.create("wegas-userpreferences", Y.Plugin.Base, [Y.Wegas.Plugin], {
        initializer: function () {
            this.afterHostEvent("render", function () {
                var k, entity = Y.Wegas.UserFacade.rest.get("currentUser").getMainAccount(),
                host = this.get("host"),
                fieldsToIgnore = [];
                for (k in entity.toObject()) {                                      //hide ineditable fields
                    if (k !== 'firstname' && k !== 'lastname'
                        && k !== 'password' && k !== 'submit') {
                        fieldsToIgnore.push(k);
                    }
                }
                host.cancelButton.hide();
                host.set("cfg", entity.getFormCfg(fieldsToIgnore));
                host.set("values", entity.toObject());
            });

            this.onHostEvent("submit", function (e) {
                this.get("host").showOverlay();
                this.sendUpdate();
            }, this);
        },

        sendUpdate: function () {
            var k,
            user = Y.Wegas.UserFacade.rest.get("currentUser").getMainAccount().toObject(),
            host = this.get("host"),
            updatedAccount = host.get('form').getValue();

            for (k in user) {                                           //need to send an "JpAccount", thus merge account and updates
                if (!updatedAccount[k]) {
                    updatedAccount[k] = user[k];
                }
            }
            Y.Wegas.UserFacade.rest.sendRequest({
                request: "/Account/" + updatedAccount.id,
                cfg: {
                    method: "PUT",
                    data: updatedAccount
                },
                on: {
                    success: Y.bind(function (e) {
                        this.showMessage("success", "Your account had been successfully updated", 4000);
                        this.hideOverlay();
                    }, host),
                    failure: Y.bind(function (e) {
                        this.showMessage("error", e.response.results.message || "Error updating user", 4000);
                        this.hideOverlay();
                    }, host)
                }
            });
        }
    }, {
        NAME: "UserPreferences",
        NS: "UserPreferences"
    });

    Y.Plugin.UserPreferences = UserPreferences;
});