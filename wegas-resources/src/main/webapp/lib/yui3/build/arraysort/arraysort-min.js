/*
YUI 3.10.3 (build 2fb5187)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add("arraysort",function(e,t){var n=e.Lang,r=n.isValue,i=n.isString;e.ArraySort={compare:function(e,t,n){return r(e)?r(t)?(i(e)&&(e=e.toLowerCase()),i(t)&&(t=t.toLowerCase()),e<t?n?1:-1:e>t?n?-1:1:0):-1:r(t)?1:0}}},"3.10.3",{requires:["yui-base"]});
