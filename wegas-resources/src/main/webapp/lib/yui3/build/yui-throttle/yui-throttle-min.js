/*
YUI 3.10.1 (build 8bc088e)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add("yui-throttle",function(e,t){
/*! Based on work by Simon Willison: http://gist.github.com/292562 */
;e.throttle=function(t,n){n=n?n:e.config.throttleTime||150;if(n===-1)return function(){t.apply(null,arguments)};var r=e.Lang.now();return function(){var i=e.Lang.now();i-r>n&&(r=i,t.apply(null,arguments))}}},"3.10.1",{requires:["yui-base"]});
