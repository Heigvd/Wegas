/*
YUI 3.11.0 (build d549e5c)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add("dataschema-base",function(e,t){var n=e.Lang,r={apply:function(e,t){return t},parse:function(t,r){if(r.parser){var i=n.isFunction(r.parser)?r.parser:e.Parsers[r.parser+""];i&&(t=i.call(this,t))}return t}};e.namespace("DataSchema").Base=r,e.namespace("Parsers")},"3.11.0",{requires:["base"]});
