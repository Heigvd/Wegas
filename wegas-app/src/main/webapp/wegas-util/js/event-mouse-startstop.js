/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("event-mouse-startstop", function(Y) {
    "use strict";
    var STARTTIME = 20, STOPTIME = 20;
    Y.Event.define("mousestart", {
        on: function(node, subscription, notifier) {
            subscription._handle = node.on("mousemove", function(e) {
                if (!subscription._stoptimer) {
                    subscription._tremblingtimer = Y.later(STARTTIME, this, this._startdetected, [e, notifier]);
                } else {
                    subscription._stoptimer.cancel();
                }
                subscription._stoptimer = Y.later(STOPTIME, this, this._onmousestop, [subscription]);
            }, this);
        }, delegate: function(node, subscription, notifier, filter) {
            subscription._handle = node.delegate("mousemove", function(e) {
                if (!subscription._stoptimer) {
                    subscription._tremblingtimer = Y.later(STARTTIME, this, this._startdetected, [e, notifier]);
                } else {
                    subscription._stoptimer.cancel();
                }
                subscription._stoptimer = Y.later(STOPTIME, this, this._onmousestop, [subscription]);
            }, filter, this);
        },
        _onmousestop: function(subscription) {
            subscription._tremblingtimer.cancel();
            subscription._stoptimer = null;
        },
        _startdetected: function(event, notifier) {
            notifier.fire(event);
        },
        detach: function(node, subscription, notifier) {
            subscription._handle.detach();
            if (subscription._tremblingtimer) {
                subscription._tremblingtimer.cancel();
            }
            if (subscription._stoptimer) {
                subscription._stoptimer.cancel();
            }
        },
        detachDelegate: function(node, subscription, notifier) {
            if (subscription._handle) {
                subscription._handle.detach();
            }
            if (subscription._tremblingtimer) {
                subscription._tremblingtimer.cancel();
            }
            if (subscription._stoptimer) {
                subscription._stoptimer.cancel();
            }
        }
    });
    Y.Event.define("mousestop", {
        on: function(node, subscription, notifier) {
            subscription._handle = node.on("mousemove", function(e) {
                if (!subscription._stoptimer) {
                    subscription._tremblingtimer = Y.later(STARTTIME, this, this._startdetected, [e, notifier]);
                } else {
                    subscription._stoptimer.cancel();
                }
                subscription._stoptimer = Y.later(STOPTIME, this, this._onmousestop, [e, subscription, notifier]);
            }, this);
        }, delegate: function(node, subscription, notifier, filter) {
            subscription._handle = node.delegate("mousemove", function(e) {
                if (!subscription._stoptimer) {
                    subscription._tremblingtimer = Y.later(STARTTIME, this, this._startdetected, [e, subscription, notifier]);
                } else {
                    subscription._stoptimer.cancel();
                }
                subscription._stoptimer = Y.later(STOPTIME, this, this._onmousestop, [e, subscription, notifier]);
            }, filter, this);
        },
        _onmousestop: function(event, subscription, notifier) {
            subscription._stoptimer = null;
            subscription._tremblingtimer.cancel();
            if (subscription._started) {
                notifier.fire(event);
            }
            subscription._started = null;
        },
        _startdetected: function(event, subscription, notifier) {
            subscription._started = true;
        },
        detach: function(node, subscription, notifier) {
            subscription._handle.detach();
            subscription._started = null;
            if (subscription._tremblingtimer) {
                subscription._tremblingtimer.cancel();
            }
            if (subscription._stoptimer) {
                subscription._stoptimer.cancel();
            }
        },
        detachDelegate: function(node, subscription, notifier) {
            subscription._started = false;
            if (subscription._handle) {
                subscription._handle.detach();
            }
            if (subscription._tremblingtimer) {
                subscription._tremblingtimer.cancel();
            }
            if (subscription._stoptimer) {
                subscription._stoptimer.cancel();
            }
        }
    });
});
