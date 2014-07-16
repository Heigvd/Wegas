/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-helper', function(Y) {
    "use strict";
    /**
     * @name Y.Wegas.Helper
     * @class
     * @constructor
     */

    var Helper = {
        /**
         * Generate ID an unique id based on current time.
         * @function
         * @static
         * @return {Number} time
         * @description
         */
        genId: function() {
            var now = new Date();
            return now.getHours() + now.getMinutes() + now.getSeconds();
        },
        /**
         * Escape a html string by replacing <, > and " by their html entities.
         *
         * @function
         * @static
         * @param {String} str
         * @return {String} Escaped string
         */
        htmlEntities: function(str) {
            return String(str).replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        },
        /**
         * Replace any text line return
         * @function
         * @static
         * @param {String} str the string to escape
         * @param {String} replaceBy The value to replace with, default is \<br \/\>
         * @return {String} Escaped string
         */
        nl2br: function(str, replaceBy) {
            replaceBy = replaceBy || '<br />';
            return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + replaceBy + '$2');
        },
        escapeJSString: function(str) {
            return str.replace(/"/g, "\\\"").replace(/(\r\n|\n\r|\r|\n)/g, "");
            //.replace(/(\r\n|\n\r|\r|\n)/g, "\\n");
        },
        unesacapeJSString: function(str) {
            return str.replace(/\\"/g, '"');
        },
        escapeCSSClass: function(str) {
            return str.replace(/ /g, "-").toLowerCase();
        },
        stripHtml: function(html) {
            var div = document.createElement("div");
            div.innerHTML = html;
            return div.textContent || div.innerText || "";
        },
        /**
         * Format a date, using provided format string.
         *
         * @function
         * @static
         * @argument {Number} timestamp
         * @argument {String} fmt the format to apply, ex. '%d.%M.%Y at %H:%i:%s' <br />
         * d	Day of the month, 2 digits with leading zeros <br />
         * m	Numeric representation of a month, with leading zeros <br />
         * M	A short textual representation of a month, three letters <br />
         * Y	A full numeric representation of a year, 4 digits <br />
         * H	24-hour format of an hour with leading zeros <br />
         * i	Minutes with leading zeros <br />
         * s	Seconds, with leading zeros <br />
         * @returns {String} formated date
         */
        formatDate: function(timestamp, fmt) {
            var date = new Date(timestamp),
                months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            function pad(value) {
                return (value.toString().length < 2) ? '0' + value : value;
            }
            return fmt.replace(/%([a-zA-Z])/g, function(_, fmtCode) {
                switch (fmtCode) {
                    case 'Y':
                        return date.getFullYear();
                    case 'M':
                        return months[date.getMonth()];
                    case 'm':
                        return pad(date.getMonth() + 1);
                    case 'd':
                        return pad(date.getDate());
                    case 'H':
                        return pad(date.getHours());
                    case 'i':
                        return pad(date.getMinutes());
                    case 's':
                        return pad(date.getSeconds());
                    default:
                        throw new Error('Unsupported format code: ' + fmtCode);
                }
            });
        },
        /**
         * Returns a time lapse between provided timestamp and now, e.g. "a month ago",
         * "2 hours ago", "10 minutes ago"
         * @function
         * @static
         * @argument {Number} timestamp
         * @return {String} The formatted time
         */
        smartDate: function(timestamp) {
            var date = new Date(timestamp),
                now = new Date(),
                diffN = now.getTime() - timestamp,
                oneMinute = 60 * 1000,
                oneHour = 60 * oneMinute,
                oneDay = 24 * oneHour;
            // oneMonth =  30 * oneDay,
            // oneYear =  365 * oneDay;

            if (!date.getTime()) {
                return "undefined";
            }

            if (diffN < oneMinute) {                                           // last minute
                return Math.round(diffN / 1000) + " seconds ago";
            } else if (diffN < oneHour) {                                      // last hour
                return  Math.round(diffN / oneMinute) + " minutes ago";
            } else if (diffN < oneDay
                && now.getDay() === date.getDay()) {                            // Today
                return Helper.formatDate(timestamp, "%H:%i");
            } else if (date.getYear() === now.getYear()) {                      // This year
                return Helper.formatDate(timestamp, "%d %M");
            } else {                                                             // Older
                return Helper.formatDate(timestamp, "%d %M %Y");
            }

        },
        /**
         * Java hashCode implementation
         * @param {String} value to hash
         * @returns {Number}
         */
        hashCode: function(value) {
            return Y.Array.reduce(value.split(""), 0, function(prev, curr) {
                prev = ((prev << 5) - prev) + curr.charCodeAt(0);
                return prev |= 0; //Force 32 bits
            });
        },
        /**
         * Return an object with functions (first level only, not objects in object...)
         *  that will execute the supplied function in the supplied object's context,
         *  optionally adding any additional supplied parameters to the beginning of
         *  the arguments collection the supplied to the function.
         * @param {Object} o the object with in functions to execute on the context object.
         * @param {Object} c the execution context.
         * @param {any} 0..n arguments to include before the arguments the function is executed with.
         * @returns An object with the wrapped functions.
         */
        superbind: function(o, c) {
            var i, args = arguments.length > 0 ? Y.Array(arguments, 0, true) : null;
            for (i in o) {
                args[0] = o[i];
                o[i] = Y.bind.apply(c, args);
            }
            return o;
        },
        getURLParameter: function(name) {
            var param = (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1];
            return param ? decodeURIComponent(param) : param;
        },
        getFilename: function(path) {
            return path.replace(/^.*[\\\/]/, '');
        },
        /**
         * @function
         * source: http://stackoverflow.com/a/15203639
         * @param {type} el
         * @returns {Boolean}
         */
        isElementVisible: function(el) {
            if (el.getDOMNode) {
                el = el.getDOMNode();
            }
            var eap,
                rect = el.getBoundingClientRect(),
                docEl = document.documentElement,
                vWidth = window.innerWidth || docEl.clientWidth,
                vHeight = window.innerHeight || docEl.clientHeight,
                efp = function(x, y) {
                    return document.elementFromPoint(x, y);
                },
                contains = "contains" in el ? "contains" : "compareDocumentPosition",
                has = contains == "contains" ? 1 : 0x14;
            // Return false if it's not in the viewport
            if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight)
                return false;
            // Return true if any of its four corners are visible
            return ((eap = efp(rect.left, rect.top)) == el || el[contains](eap) == has || (eap = efp(rect.right, rect.top)) == el || el[contains](eap) == has || (eap = efp(rect.right, rect.bottom)) == el || el[contains](eap) == has || (eap = efp(rect.left, rect.bottom)) == el || el[contains](eap) == has);
        }
    };
    Y.namespace("Wegas").Helper = Helper;
    Y.namespace("Wegas").superbind = Helper.superbind;
    Y.namespace("Wegas").Timer = Y.Base.create("wegas-timer", Y.Base, [], {
        start: function() {
            if (!this.handler) {
                this.handler = Y.later(this.get("duration"), this, this.timeOut);
            }
        },
        reset: function() {
            if (this.handler) {
                this.handler.cancel();
            }
            this.handler = Y.later(this.get("duration"), this, this.timeOut);
        },
        timeOut: function() {
            this.handler = null;
            this.fire("timeOut");
        },
        destructor: function() {
            if (this.handler) {
                this.fire("timeOut");
                this.handler.cancel();
                this.handler = null;
            }
        }
    }, {
        ATTRS: {
            duration: {
                value: 400
            }
        }
    });
    Y.Object.filter = function(o, fn) {
        var r = {};
        Y.Object.each(o, function(i, k) {
            if (fn(i, k))
                r[k] = i;
        });
        return r;
    };
    /**
     * asynchronous function queuing, chain asychronous operations
     *
     * @class Y.Wegas.Helper.Queue
     * @constructor
     */
    Helper.Queue = (function() {
        /**
         * 
         * @constructor Q
         * @returns {_L250.Q}
         */
        var Q = function() {
            this._f = []; // function queue
            this._a = []; // arguments queue
            this._lock = false;
        },
            doNext = function(queue) {
                var cb;
                if (queue._f.length && !queue._lock) {
                    queue._lock = true;
                    cb = queue._f.shift();
                    cb.apply(cb, [queue].concat(queue._a.shift()));
                }
            };
        Q.prototype = {
            /*@lends Y.Wegas.Helper.Queue#*/
            /**
             * Add a function to queue and runs it if lock is released.
             * Chainable.
             * @param {Function} cb callback function
             * @param {Any*} args additional arguments passed to callback function.
             * @returns {_L250.Q.prototype}
             */
            add: function(cb, args) {
                if (typeof cb !== "function") {
                    return this;
                }
                this._f.push(cb);
                this._a.push(Array.prototype.splice.call(arguments, 0, 1));
                doNext(this);
                return this;
            },
            /**
             * release lock and run next function if any.
             * @returns {undefined}
             */
            next: function() {
                this._lock = false;
                doNext(this);
            },
            /**
             * remove further callbacks.
             * Chainable.
             * @returns {_L254.Q.prototype}
             */
            empty: function() {
                this._f.length = 0;
                this._a.length = 0;
                return this;
            }
        };
        return  Q;
    }());
});
