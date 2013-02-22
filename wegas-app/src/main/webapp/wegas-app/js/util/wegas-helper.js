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

        /**
         * Format a date, using provided format string.
         *
         * @function
         * @static
         * @argument {Number} timestamp
         * @argument {String} fmt the format to apply, ex. '%d.%M.%Y at %H:%m:%s'
         * @returns {String} formated date
         */
        formatDate: function(timestamp, fmt) {
            var date = new Date(timestamp);

            function pad(value) {
                return (value.toString().length < 2) ? '0' + value : value;
            }
            return fmt.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
                switch (fmtCode) {
                    case 'Y':
                        return date.getFullYear();
                    case 'M':
                        return pad(date.getMonth() + 1);
                    case 'd':
                        return pad(date.getDate());
                    case 'H':
                        return pad(date.getHours());
                    case 'm':
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
        smartDate: function (timestamp) {
            var date = new Date(timestamp),
            now = new Date(),
            diff = new Date(now.getTime() - timestamp),
            diffN = now.getTime() - timestamp,
            oneMinute = 60 * 1000,
            oneHour = 60 * oneMinute,
            oneDay =24 * oneHour,
            oneMonth =  30 * oneDay,
            oneYear =  365 * oneDay;

            if (!date.getTime()) {
                return "undefined";
            }

            if (diffN <  oneMinute) {
                return diff.getUTCSeconds() + " seconds ago";
            } else if (diffN <  oneHour) {
                return diff.getUTCMinutes() + " minutes ago";
            } else if (diffN <  oneDay
                && now.getUTCDay() === date.getUTCDay()) {                                       // Today
                //return diff.getUTCHours() + " hours ago";
                return Helper.formatDate(timestamp, "%H:%m");
//            } else {if (diffN <  30 * 24 * 60 * 60 * 1000) {                     // last month
//                return diff.getUTCDay() + " days ago";
//            } else if (diffN <  oneMonth) {
//                return Math.round(diff / oneMonth) + " month ago";
            } else {
                return Helper.formatDate(timestamp, "%H:%m");
                return Math.round(diff / oneYear) + " years ago";
            }

        }
    }
    Y.namespace("Wegas").Helper = Helper;

});
