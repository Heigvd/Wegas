/*
YUI 3.11.0 (build d549e5c)
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

YUI.add("series-line-stacked",function(e,t){e.StackedLineSeries=e.Base.create("stackedLineSeries",e.LineSeries,[e.StackingUtil],{setAreaData:function(){e.StackedLineSeries.superclass.setAreaData.apply(this),this._stackCoordinates.apply(this)}},{ATTRS:{type:{value:"stackedLine"}}})},"3.11.0",{requires:["series-stacked","series-line"]});
