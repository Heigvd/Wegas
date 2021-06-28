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
YUI.add('wegas-lockmanager', function(Y) {
    "use strict";

    var LockManager, Lockable;

    LockManager = Y.Base.create("wegas-lockmanager", Y.Plugin.Base, [], {
        initializer: function() {
            this._locks = {};
            Y.Wegas.Facade.Game.sendRequest({
                request: "/Team/" + Y.Wegas.Facade.Game.get("currentTeamId") + "/Player/" + Y.Wegas.Facade.Game.get("currentPlayerId") + "/Locks",
                on: {
                    success: Y.bind(this.initLocks, this)
                }
            });
        },
        initLocks: function(e) {
            var token, i;
            for (i in e.response.entities) {
                token = e.response.entities[i];
                this.lock(token);
            }
        },
        destructor: function() {
        },
        register: function(token, listener) {
            var lock = this._locks[token] = this._locks[token] || {locked: false,
                listeners: []
            };
            if (listener) {
                lock.listeners.push(listener);
                if (lock.locked) {
                    listener.lock();
                }
            }
        },
        unregister: function(token, listener) {
            var lock = this._locks[token], i;
            if (lock) {
                i = lock.listeners.indexOf(listener);
                if (i > -1) {
                    lock.listeners.splice(i, 1);
                }
                // Lock not locked nor watched -> destroy
                if (!lock.locked && lock.listeners.length === 0) {
                    delete this._locks[token];
                }
            }
        },
        lock: function(token) {
            var i;
            this.register(token, null);
            if (!this._locks[token].locked) {
                // avoid to relock already locked elements
                this._locks[token].locked = true;

                for (i in this._locks[token].listeners) {
                    this._locks[token].listeners[i].lock();
                }
            }
        },
        unlock: function(token) {
            var lock = this._locks[token], i;
            if (lock) {
                if (lock.listeners.length === 0) {
                    //No listeners -> delete lock
                    delete this._locks[token];
                } else {
                    lock.locked = false;
                    for (i in lock.listeners) {
                        lock.listeners[i].unlock();
                    }
                }
            }
        }
    }, {
        NS: "lockmanager",
        ATTRS: {
        }
    });
    Y.Plugin.LockManager = LockManager;


    Lockable = Y.Base.create("wegas-lockable", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            this.after("tokenChange", this.onTokenChange, this);
            this.onTokenChange();
        },
        destructor: function() {
            this.unregister();
        },
        register: function() {
            this._counter = 0;
            Y.Wegas.app.lockmanager.register(this.get("token"), this);
        },
        unregister: function() {
            Y.Wegas.app.lockmanager.unregister(this.get("token"), this);
        },
        onTokenChange: function() {
            var newToken = this.get("token");
            if (newToken !== this._token) {
                if (this._token) {
                    this.unregister();
                }
                this.register();
                this._token = newToken;
            }
        },
        lock: function() {
            if (this._counter === 0) {
                var host = this.get("host");
                host.get("contentBox").addClass("locked");
                if (host._enable && host._disable) {
                    host._disable("LOCK");
                } else {
                    host.set("disabled", true);
                }
            }
            this._counter++;
        },
        unlock: function() {
            var host = this.get("host");
            this._counter--;
            if (this._counter === 0) {
                host.get("contentBox").removeClass("locked");
                if (host._enable && host._disable) {
                    host._enable("LOCK");
                } else {
                    host.set("disabled", false);
                }
            }
        }
    }, {
        NS: "lockable",
        ATTRS: {
            token: {
                type: "string",
                label: "Lock name",
                value: "myToken",
                view:{ label: "Token" }
            }
        }
    });
    Y.Plugin.Lockable = Lockable;
});
