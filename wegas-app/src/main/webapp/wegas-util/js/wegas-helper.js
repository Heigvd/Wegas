/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global Element, HTMLElement, TextEncoder */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-helper', function(Y) {
    "use strict";
    var Wegas = Y.namespace("Wegas"),
        Helper;
    /**
     * @name Y.Wegas.Helper
     * @class
     * @constructor
     */
    Helper = {
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
            return (String(str)).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + replaceBy + '$2');
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
        trimLength: function(string, length, after) {
            after = after || "...";
            return string.length > length ? string.substring(0, length - after.length) + after :
                string.substring(0, length);
        },
        /**
         * Format a date, using provided format string.
         *
         * @function
         * @static
         * @argument {Number} timestamp
         * @argument {String} fmt the format to apply, ex. '%d.%M.%Y at %H:%i:%s' <br />
         * d    Day of the month, 2 digits with leading zeros <br />
         * m    Numeric representation of a month, with leading zeros <br />
         * M    A short textual representation of a month, three letters <br />
         * Y    A full numeric representation of a year, 4 digits <br />
         * H    24-hour format of an hour with leading zeros <br />
         * i    Minutes with leading zeros <br />
         * s    Seconds, with leading zeros <br />
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
        smartDate: function(timestamp, prefix) {
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

            if (diffN < oneMinute) { // last minute
                return Math.round(diffN / 1000) + " seconds ago";
            } else if (diffN < oneHour) { // last hour
                return Math.round(diffN / oneMinute) + " minutes ago";
            } else if (diffN < oneDay && now.getDay() === date.getDay()) { // Today
                return (prefix ? "at " : "") + Helper.formatDate(timestamp, "%H:%i");
            } else if (date.getYear() === now.getYear()) { // This year
                return (prefix ? "the " : "") + Helper.formatDate(timestamp, "%d %M");
            } else { // Older
                return (prefix ? "the " : "") + Helper.formatDate(timestamp, "%d %M %Y");
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
                return (prev |= 0); //Force 32 bits
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
                if (o.hasOwnProperty(i)) {
                    args[0] = o[i];
                    o[i] = Y.bind.apply(c, args);
                }
            }
            return o;
        },
        getURLParameter: function(name) {
            var param = ((new RegExp(name + '=' + '(.+?)(&|$)')).exec(location.search) || [, null])[1];
            return param ? decodeURIComponent(param) : param;
        },
        getURLParameters: function() {
            var match,
                search = /([^&=]+)=?([^&]*)/g,
                query = window.location.search.substring(1),
                params = {};
            while (match = search.exec(query)) {
                params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
            }
            return params;
        },
        setURLParameters: function(params) {
            var par, str = [], tmp;
            for (par in params) {
                if (params.hasOwnProperty(par)) {
                    tmp = encodeURIComponent(par);
                    if (params[par]) {
                        tmp += "=" + encodeURIComponent(params[par]);
                    }
                    str.push(tmp);
                }
            }
            window.location.search = "?" + str.join("&");
        },
        getFilename: function(path) {
            return path.replace(/^.*[\\\/]/, '');
        },
        /**
         *
         */
        scrollIntoViewIfNot: function(node, alignTop) {

            // Polyfill for scrollIntoViewIfNeeded(), from https://gist.github.com/jocki84
            if (!Element.prototype.scrollIntoViewIfNeeded) {
                Element.prototype.scrollIntoViewIfNeeded = function(centerIfNeeded) {
                    function withinBounds(value, min, max, extent) {
                        if (max - min > extent) {
                            if (value > min) {
                                // current scroll too far
                                return min;
                            }
                            if (value + extent < max) {
                                // current scroll too near
                                return max - extent;
                            }
                            // partially visible, don't change anything
                            return value;
                        } else {
                            // enough place to show the whole area
                            if (value > min) {
                                // current scroll too far
                                if (centerIfNeeded) {
                                    // center
                                    return (min + max - extent) / 2;
                                }
                                // align bottom
                                return max - extent;
                            }
                            if (value + extent < max) {
                                // current scroll too near
                                if (centerIfNeeded) {
                                    // center
                                    return (min + max - extent) / 2;
                                }
                                // align top
                                return min;
                            }
                        }
                        return value;
                    }

                    function translate(area, x, y) {
                        return makeArea(x + area.left, y + area.top, area.width, area.height);
                    }

                    function makeArea(left, top, width, height) {
                        return  {
                            "left": left, "top": top, "width": width, "height": height,
                            "right": left + width, "bottom": top + height,
                            "relativeFromTo": function(lhs, rhs) {
                                var newLeft = left, newTop = top;
                                lhs = lhs.offsetParent;
                                rhs = rhs.offsetParent;
                                if (lhs === rhs) {
                                    return area;
                                }
                                for (; lhs; lhs = lhs.offsetParent) {
                                    newLeft += lhs.offsetLeft + lhs.clientLeft;
                                    newTop += lhs.offsetTop + lhs.clientTop;
                                }
                                for (; rhs; rhs = rhs.offsetParent) {
                                    newLeft -= rhs.offsetLeft + rhs.clientLeft;
                                    newTop -= rhs.offsetTop + rhs.clientTop;
                                }
                                return makeArea(newLeft, newTop, width, height);
                            }
                        };
                    }

                    var parent, elem = this, area = makeArea(
                        this.offsetLeft, this.offsetTop,
                        this.offsetWidth, this.offsetHeight);
//                    Y.log("InitialArea: " + JSON.stringify(area));
                    while ((parent = elem.parentNode) instanceof HTMLElement) {
                        var clientLeft = parent.offsetLeft + parent.clientLeft;
                        var clientTop = parent.offsetTop + parent.clientTop;
                        // Make area relative to parent's client area.
                        area = translate(area.relativeFromTo(elem, parent),
                            -clientLeft, -clientTop);
//                        Y.log(" - TrArea: " + JSON.stringify(area));
//                        Y.log("Parent.scroll: " + parent.scrollLeft + " : " + parent.scrollTop);
                        parent.scrollLeft = withinBounds(
                            parent.scrollLeft,
                            area.left, area.right,
                            parent.clientWidth);
                        parent.scrollTop = withinBounds(
                            parent.scrollTop,
                            area.top, area.bottom,
                            parent.clientHeight);
                        Y.log("Parent.scroll: " + parent.scrollLeft + " : " + parent.scrollTop);
                        Y.log(" - TrAreaPre: " + JSON.stringify(area));
                        area.width = Math.min(area.width, parent.clientWidth);
                        area.height = Math.min(area.height, parent.clientHeight);
                        Y.log(" - TrAreaMid: " + JSON.stringify(area));
//                        Y.log("Parent.scroll: " + parent.scrollLeft + " : " + parent.scrollTop);
//                        Y.log(" - TrAreaPre: " + JSON.stringify(area));
                        area.width = Math.min(area.width, parent.clientWidth);
                        area.height = Math.min(area.height, parent.clientHeight);
//                        Y.log(" - TrAreaMid: " + JSON.stringify(area));

                        // Determine actual scroll amount by reading back scroll properties.
                        area = translate(area, clientLeft - parent.scrollLeft,
                            clientTop - parent.scrollTop);
//                        Y.log(" - TrAreapost: " + JSON.stringify(area));
                        elem = parent;
                    }
                };
            }
            if (node instanceof Node) {
                node.scrollIntoViewIfNeeded(true);
            } else {
                node.getDOMNode().scrollIntoViewIfNeeded(true);
            }
        },
        /**
         * Quote a given string to be passed in a regular expression
         *
         * @param str String the string to quote
         * @returns String the quoted string
         */
        RegExpQuote: function(str) {
            return (String(str)).replace(/([.*?+\^$\[\]\\(){}|\-])/g, "\\$1");
        },
        utf8ArrayToStr: function(array) {
            var out, i, len, char;
            var char2, char3, char4;
            out = [];
            len = array.length;
            for (var i = 0; i < len; i++) {
                char = array[i];
                if (char & 0x80 === 0) {
                    // 0xxx xxxx => 1 byte as is
                    out.push(String.fromCharCode(char));
                } else if (char & 0xC0) {
                    // 110x xxxx  10xx xxxx => 2 bytes
                    char2 = array[i++];
                    out.push(String.fromCharCode(((char & 0x1F) << 6) | (char2 & 0x3F)));
                } else if (char & 0xC0) {
                    // 1110 xxxx  10xx xxxx 10xx xxxx=> 3 bytes
                    char2 = array[i++];
                    char3 = array[i++];

                    out.push(String.fromCharCode(
                        ((char & 0x0F) << 12) | ((char2 & 0x3F) << 6) | (char3 & 0x3F))
                        );
                } else if (char & 0xF0) {
                    // 1111 0xxx  10xx xxxx 10xx xxxx 10xx xxxx => 3 bytes
                    char2 = array[i++];
                    char3 = array[i++];
                    char4 = array[i++];

                    out.push(String.fromCharCode(
                        ((char & 0x07) << 18)
                        | ((char2 & 0x3F) << 12)
                        | ((char3 & 0x3F) << 6)
                        | (char4 & 0x3F))
                        );
                }
            }

            return out.join("");
        },
        /**
         *
         * @param {type} string
         * @returns {Array}
         */
        utf16toCodePoints: function(string) {
            var s = String(string);
            var len = s.length;

            var cps = [];

            for (var i = 0; i < len; i++) {
                var c = s.charCodeAt(i);
                if (c < 0xD800 || c >= 0xE000) {
                    // those code point are stored as-is
                    cps.push(c);
                } else if (c < 0xDC00) {
                    // those codepoints are encoded on two chars (surrogate pair)
                    if (i < len) {
                        i++;
                        var c2 = s.charCodeAt(i);
                        cps.push(0x10000 | ((c & 0x3FF) << 10) | (c2 & 0x3FF))
                    } else {
                        // whoops there is no two chars left
                        cps.push(0xFFFD);
                    }
                } else if (c < 0xE000) {
                    // invalid as such a char should have been handled by the previous case.
                    cps.push(0xFFFD);
                }
            }
            return cps;
        },
        strToUtf8Array: function(str) {
            var cp = Y.Wegas.Helper.utf16toCodePoints(str);
            var array = [];
            for (var i = 0; i < cp.length; i++) {
                var char = cp[i];
                // how many byte ?
                if (char < 0x7F) {
                    // 7bits on one byte
                    // 0xxxxxxx
                    array.push(char);
                } else if (char <= 0x7FF) {
                    // 11bits on two bytes
                    // 110x xxxx 10xx xxxx
                    array.push(0xC0 | (char >> 6));
                    array.push(0x80 | (char & 0x3F));
                } else if (char <= 0xFFFF) {
                    // 16bits on three bytes
                    // 1110xxxx 10xxxxxx 10xxxxxx
                    array.push(0xE0 | (char >> 12));
                    array.push(0x80 | (char >> 6 & 0x3F));
                    array.push(0x80 | (char & 0x3F));
                } else {
                    // 24bits on four bytes
                    // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
                    array.push(0xF0 | (char >> 18));
                    array.push(0x80 | (char >> 12 & 0x3F));
                    array.push(0x80 | (char >> 6 & 0x3F));
                    array.push(0x80 | (char & 0x3F));
                }
            }

            return new Uint8Array(array);
        },
        /**
         * digest the value with the given algorithm
         * @param {type} algorithm one of PLAIN (return the value as-is), SHA-256, SHA-384, SHA-512
         * @param {type} data the value to hash
         * @returns {Promise}
         */
        digest: function(algorithm, data) {
            // encode as (utf-8) Uint8Array
            if (algorithm === 'PLAIN') {
                return new Promise(function(resolve) {
                    resolve(data);
                });
            } else {
                var msgUint8 =
                    (typeof (TextEncoder) !== 'undefined' ?
                        new TextEncoder().encode(data)
                        : Y.Wegas.Helper.strToUtf8Array(data));
                return crypto.subtle.digest(algorithm, msgUint8)
                    .then(function(hashBuffer) {
                        var hashArray = Array.from(new Uint8Array(hashBuffer));
                        return hashArray.map(function(b) {
                            return b.toString(16).padStart(2, '0');
                        }).join(''); // convert bytes to hex string
                    });
            }
        }
    };
    Wegas.Helper = Helper;
    Wegas.superbind = Helper.superbind;
    /**
     *
     */
    Wegas.Timer = Y.Base.create("wegas-timer", Y.Base, [], {
        start: function() {
            if (!this.handler) {
                this.handler = Y.later(this.get("duration"), this, this.timeOut);
            }
            return this;
        },
        reset: function() {
            this.cancel();
            return this.start();
        },
        cancel: function() {
            if (this.handler) {
                this.handler.cancel();
                this.handler = null;
            }
            return this;
        },
        timeOut: function() {
            this.cancel();
            this.fire("timeOut");
            return this;
        },
        destructor: function() {
            this.cancel();
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
            if (fn(i, k)) {
                r[k] = i;
            }
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
        return Q;
    }());
    Helper.Diacritics = (function() {
        /**
         * Map originally at
         * http://web.archive.org/web/20120918093154/http://lehelk.com/2011/05/06/script-to-remove-diacritics/
         */
        var DIACRITICS = {
            'a': /[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g,
            'aa': /[\uA733]/g,
            'ae': /[\u00E6\u01FD\u01E3]/g,
            'ao': /[\uA735]/g,
            'au': /[\uA737]/g,
            'av': /[\uA739\uA73B]/g,
            'ay': /[\uA73D]/g,
            'b': /[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g,
            'c': /[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g,
            'd': /[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g,
            'dz': /[\u01F3\u01C6]/g,
            'e': /[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g,
            'f': /[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g,
            'g': /[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g,
            'h': /[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g,
            'hv': /[\u0195]/g,
            'i': /[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g,
            'j': /[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g,
            'k': /[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g,
            'l': /[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g,
            'lj': /[\u01C9]/g,
            'm': /[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g,
            'n': /[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g,
            'nj': /[\u01CC]/g,
            'o': /[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g,
            'oe': /[\u0153]/g,
            'oi': /[\u01A3]/g,
            'ou': /[\u0223]/g,
            'oo': /[\uA74F]/g,
            'p': /[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g,
            'q': /[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g,
            'r': /[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g,
            's': /[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g,
            'ss': /[\u1E9E]/g,
            't': /[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g,
            'tz': /[\uA729]/g,
            'u': /[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g,
            'v': /[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g,
            'vy': /[\uA761]/g,
            'w': /[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g,
            'x': /[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g,
            'y': /[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g,
            'z': /[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g,
            'A': /[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g,
            'AA': /[\uA732]/g,
            'AE': /[\u00C6\u01FC\u01E2]/g,
            'AO': /[\uA734]/g,
            'AU': /[\uA736]/g,
            'AV': /[\uA738\uA73A]/g,
            'AY': /[\uA73C]/g,
            'B': /[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g,
            'C': /[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g,
            'D': /[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g,
            'DZ': /[\u01F1\u01C4]/g,
            'Dz': /[\u01F2\u01C5]/g,
            'E': /[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g,
            'F': /[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g,
            'G': /[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g,
            'H': /[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g,
            'I': /[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g,
            'J': /[\u004A\u24BF\uFF2A\u0134\u0248]/g,
            'K': /[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g,
            'L': /[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g,
            'LJ': /[\u01C7]/g,
            'Lj': /[\u01C8]/g,
            'M': /[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g,
            'N': /[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g,
            'NJ': /[\u01CA]/g,
            'Nj': /[\u01CB]/g,
            'O': /[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g,
            'OE': /[\u0152]/g,
            'OI': /[\u01A2]/g,
            'OO': /[\uA74E]/g,
            'OU': /[\u0222]/g,
            'P': /[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g,
            'Q': /[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g,
            'R': /[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g,
            'S': /[\u0053\u24C8\uFF33\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g,
            'T': /[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g,
            'TZ': /[\uA728]/g,
            'U': /[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g,
            'V': /[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g,
            'VY': /[\uA760]/g,
            'W': /[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g,
            'X': /[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g,
            'Y': /[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g,
            'Z': /[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g
        },
            isDiacriticsRE = (function() {
                var re = [];
                Y.Object.each(DIACRITICS, function(v) {
                    re.push(v.source);
                });
                return re.join("|");
            }()),
            removeDiacritics = function(str) {
                Y.Object.each(DIACRITICS, function(v, k) {
                    str = str.replace(v, k);
                });
                return str;
            };
        return {
            removeDiacritics: removeDiacritics,
            isDiacritics: isDiacriticsRE
        };
    }());
});
