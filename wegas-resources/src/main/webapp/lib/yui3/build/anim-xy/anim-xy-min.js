/*
YUI 3.11.0 (build d549e5c)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add("anim-xy",function(e,t){var n=Number;e.Anim.behaviors.xy={set:function(e,t,r,i,s,o,u){e._node.setXY([u(s,n(r[0]),n(i[0])-n(r[0]),o),u(s,n(r[1]),n(i[1])-n(r[1]),o)])},get:function(e){return e._node.getXY()}}},"3.11.0",{requires:["anim-base","node-screen"]});
