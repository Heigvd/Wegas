/*
YUI 3.11.0 (build d549e5c)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add("template-base",function(e,t){function n(t,n){this.defaults=n,this.engine=t||e.Template.Micro,this.engine||e.error("No template engine loaded.")}n.prototype={compile:function(t,n){return n=n?e.merge(this.defaults,n):this.defaults,this.engine.compile(t,n)},precompile:function(t,n){return n=n?e.merge(this.defaults,n):this.defaults,this.engine.precompile(t,n)},render:function(t,n,r){return r=r?e.merge(this.defaults,r):this.defaults,this.engine.render?this.engine.render(t,n,r):this.engine.compile(t,r)(n,r)},revive:function(t,n){return n=n?e.merge(this.defaults,n):this.defaults,this.engine.revive?this.engine.revive(t,n):t}},e.Template=e.Template?e.mix(n,e.Template):n},"3.11.0",{requires:["yui-base"]});
