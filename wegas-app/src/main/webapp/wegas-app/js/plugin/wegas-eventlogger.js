/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author maxence
 */
YUI.add('wegas-eventlogger', function(Y) {
    "use strict";

    var EventLogger;

    EventLogger = Y.Base.create("wegas-eventlogger", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            var i, k;
            var events = [
                "*:updatedInstance",
                "updatedDescriptor",
                "added",
                "delete",
                "update"
            ];
            this.handlers = [];
            this.ds = {};
            for (k in Y.Wegas.Facade) {
                if (Y.Wegas.Facade.hasOwnProperty(k) && Y.Wegas.Facade[k] instanceof Y.Wegas.DataSource) {
                    if (!this.ds[Y.Wegas.Facade[k]._yuid]) {
                        this.ds[Y.Wegas.Facade[k]._yuid] = k;
                        for (i in events) {
                            Y.log("Bind: " + k + "::" + events[i]);
                            this.handlers.push(Y.Wegas.Facade[k].on(events[i], Y.bind(this.logEvent, this)));
                        }
                    } else {
                        Y.log("Skip duplicata: " + k);
                    }
                }
            }
        },
        _printEntity: function(entity) {
            if (entity instanceof Y.Wegas.persistence.VariableDescriptor) {
                return entity.get("@class") + " " + entity.get("name");
            } else if (entity instanceof Y.Wegas.persistence.VariableInstance) {
                return this._printEntity(entity.getDescriptor()) + " instance for " + entity.get("scopeKey");
            } else {
                return entity.get("@class");
            }
        },
        logEvent: function(e) {
            var msg = this.ds[e.target._yuid] + " fires " + e.type;
            if (e.entity) {
                msg += " with entity: ";
                msg += this._printEntity(e.entity);
            }
            if (e.parent) {
                msg += " with parent: ";
                msg += this._printEntity(e.parent);
            }
            Y.log(msg);
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        NS: "eventlogger",
        ATTRS: {}
    });
    Y.Plugin.EventLogger = EventLogger;
});
