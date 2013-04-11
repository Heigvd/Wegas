/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
            return str.replace(/"/g, '\\"').replace(/(\r\n|\n\r|\r|\n)/g, "\\n");
            //return Helper.nl2br(str.replace(/"/g, '\\"'), "\\n");
        },
        unesacapeJSString: function(str) {
            return str.replace(/\\"/g, '"');
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
                return prev |= 0;                                               //Force 32 bits
            });
        }
    };
    Y.namespace("Wegas").Helper = Helper;
});
