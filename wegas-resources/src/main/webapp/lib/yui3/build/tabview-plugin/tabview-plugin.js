/*
YUI 3.11.0 (build d549e5c)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add('tabview-plugin', function (Y, NAME) {

function TabviewPlugin() {
    TabviewPlugin.superclass.constructor.apply(this, arguments);
}

TabviewPlugin.NAME = 'tabviewPlugin';
TabviewPlugin.NS = 'tabs';

Y.extend(TabviewPlugin, Y.TabviewBase);

Y.namespace('Plugin');
Y.Plugin.Tabview = TabviewPlugin;


}, '3.11.0', {"requires": ["tabview-base"]});
