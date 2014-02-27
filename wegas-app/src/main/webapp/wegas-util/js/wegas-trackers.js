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
 */
//YUI.add("wegas-trackers", function(Y) {
//    "use strict";

    /**
     * Uservoice
     */
    // Include the UserVoice JavaScript SDK (only needed once on a page)
    UserVoice = window.UserVoice || [];
    (function() {
        var uv = document.createElement('script');
        uv.type = 'text/javascript';
        uv.async = true;
        uv.src = '//widget.uservoice.com/3sN3R6bpdxVxNcGgsuAhQ.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(uv, s);
    })();
    // UserVoice Javascript SDK developer documentation: https://www.uservoice.com/o/javascript-sdk
    UserVoice.push(['set', {//                                                  // Set colors
            accent_color: '#072644',
            trigger_color: 'white',
            trigger_background_color: 'rgba(46, 49, 51, 0.6)'
        }]);
    UserVoice.push(['identify', {//                                             // Identify the user and pass traits
            //email:      'john.doe@example.com',                               // User’s email address
            //name:       'John Doe',                                           // User’s real name
            //created_at: 1364406966,                                           // Unix timestamp for the date the user signed up
            //id:         123,                                                  // Optional: Unique id of the user (if set, this should not change)
            //type:       'Owner',                                              // Optional: segment your users by type
            //account: {
            //  id:           123,                                              // Optional: associate multiple users with a single account
            //  name:         'Acme, Co.',                                      // Account name
            //  created_at:   1364406966,                                       // Unix timestamp for the date the account was created
            //  monthly_rate: 9.99,                                             // Decimal; monthly rate of the account
            //  ltv:          1495.00,                                          // Decimal; lifetime value of the account
            //  plan:         'Enhanced'                                        // Plan name for the account
            //}
        }]);

    // Add default trigger to the bottom-right corner of the window:
    UserVoice.push(['addTrigger', {mode: 'contact', trigger_position: 'bottom-right'}]);
    UserVoice.push(['autoprompt', {}]);                                         // Autoprompt for Satisfaction and SmartVote (only displayed under certain conditions)
    //UserVoice.push(['addTrigger', '#id', { mode: 'contact' }]);               // Or, use your own custom trigger:

    UserVoice = window.UserVoice || [];
    /**
     * Google analytics
     */
    (function(i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
    ga('create', 'UA-16543988-2', 'albasim.ch');
    ga('send', 'pageview');
//});
