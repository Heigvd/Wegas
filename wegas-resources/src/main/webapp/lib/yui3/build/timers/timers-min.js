/*
YUI 3.11.0 (build d549e5c)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add("timers",function(e,t){var n=e.config.global,r=function(e){var t;return r._asynchronizer(function(){t||e()}),{cancel:function(){t=1}}};"setImmediate"in n?(r._asynchronizer=function(e){setImmediate(e)},r._impl="setImmediate"):"process"in n&&"nextTick"in process?(r._asynchronizer=process.nextTick,r._impl="nextTick"):(r._asynchronizer=function(e){setTimeout(e,0)},r._impl="setTimeout"),e.soon=r},"3.11.0",{requires:["yui-base"]});
