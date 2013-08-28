/**
 * Inspired from WireIt (https://github.com/neyric/wireit)
 */
YUI.add( "wegas-teaching-arrow", function ( Y ) {
    "use strict";
    
    Y.TeachingArrow = function (cfg) {
        Y.TeachingArrow.superclass.constructor.apply(this, arguments);
    };
    
    Y.TeachingArrow.NAME = "wegas-teaching-arrow";
    
    Y.extend(Y.TeachingArrow, Y.Path, {
        /**
         * Notify the WiresDeletates through addWire
         * @method initializer
         */
        initializer: function () {

           Y.TeachingArrow.superclass.initializer.apply(this, arguments);

           var src = this.get('src'), tgt = this.get('tgt');

           if(src && src.get) {
              this.set('srcDir', src.get('dir') );
           }

           if(tgt && tgt.get) {
              this.set('tgtDir', tgt.get('dir') );
           }

           if(src && Y.Lang.isFunction (src.addWire) ) {
              src.addWire(this);
           }
           if(tgt && Y.Lang.isFunction (tgt.addWire) ) {
              tgt.addWire(this);
           }

        },

        /**
         * @method bindUI
         */
        bindUI: function () {
           Y.TeachingArrow.superclass.bindUI.call(this);

           //this.after("bezierTangentNormChange", this._afterChangeRedraw, this);

           this.on('srcChange', function (e) {
              this.set('srcDir', e.newVal.get('dir') );
           }, this);

           this.on('tgtChange', function (e) {
              this.set('tgtDir', e.newVal.get('dir') );
           }, this);

        },

        /**
         * call removeWire on WiringsDelegate
         * @method destroy
         */
        destroy: function () {

           Y.TeachingArrow.superclass.destroy.apply(this, arguments);

           var src = this.get('src'), tgt = this.get('tgt');

           if(src && Y.Lang.isFunction (src.removeWire) ) {
              src.removeWire(this);
           }
           if(tgt && Y.Lang.isFunction (tgt.removeWire) ) {
              tgt.removeWire(this);
           }
        },

        /**
         * Drawing method. Meant to be overriden by a plugin (by WireIt)
         * @method _draw
         * @private
         */
        _draw: function () {
            var type = this.get('val');
            
            var d = 7; // arrow width/2
            var redim = d+3; //we have to make the canvas a little bigger because of arrows
            var margin=[4+redim,4+redim];

            var src = this.get('src')/*.getXY()*/;
            var tgt = this.get('tgt')/*.getXY()*/;

            var distance=Math.sqrt(Math.pow(src[0]-tgt[0],2)+Math.pow(src[1]-tgt[1],2));
            this.moveTo((src[0]+6), (src[1]+6));
            this.lineTo((tgt[0]+6), (tgt[1]+6));

            // start drawing arrows

            var t1 = src;
            var t2 = tgt;

            var z = [0,0]; //point on the wire with constant distance (dlug) from terminal2
            var dlug = 20; //arrow length
            var t = (distance === 0) ? 0 : 1-(dlug/distance);
            z[0] = Math.abs( t1[0] +  t*(t2[0]-t1[0]) );
            z[1] = Math.abs( t1[1] + t*(t2[1]-t1[1]) );   

            //line which connects the terminals: y=ax+b
            var W = src[0] - tgt[0],
                Wa = src[1] - tgt[1],
                Wb = src[0] * tgt[1] - src[1] * tgt[0],
                a, b, aProst, bProst;
            if (W !== 0) {
                a = Wa/W;
                b = Wb/W;
            }
            else {
               a = 0;
            }
            //line perpendicular to the main line: y = aProst*x + b
            if (a === 0) {
               aProst = 0;
            }
            else {
               aProst = -1/a;
            }
            bProst = z[1] - aProst*z[0]; //point z lays on this line

            //we have to calculate coordinates of 2 points, which lay on perpendicular line and have the same distance (d) from point z
            var A = 1 + Math.pow(aProst,2);
            var B = 2*aProst*bProst - 2*z[0] - 2*z[1]*aProst;
            var C = -2*z[1]*bProst + Math.pow(z[0],2) + Math.pow(z[1],2) - Math.pow(d,2) + Math.pow(bProst,2);
            var delta = Math.pow(B,2) - 4*A*C;
            if (delta < 0) { return; }

            var x1 = (-B + Math.sqrt(delta)) / (2*A);
            var x2 = (-B - Math.sqrt(delta)) / (2*A);    
            var y1 = aProst*x1 + bProst;
            var y2 = aProst*x2 + bProst;

            if(t1[1] == t2[1]) {
                 var o = (t1[0] > t2[0]) ? 1 : -1;
                  x1 = t2[0]+o*dlug;
                  x2 = x1;
                  y1 -= d;
                  y2 += d;
            }      

            if (type == 1 || type == 3) {
                this.moveTo(t2[0]+6,t2[1]+6);
                this.lineTo(x1+6,y1+6);
                this.moveTo(t2[0]+6,t2[1]+6);
                this.lineTo(x2+6,y2+6);
            }

            t1 = tgt;
            t2 = src;

            var z = [0,0]; //point on the wire with constant distance (dlug) from terminal2
            var dlug = 20; //arrow length
            var t = (distance == 0) ? 0 : 1-(dlug/distance);
            z[0] = Math.abs( t1[0] +  t*(t2[0]-t1[0]) );
            z[1] = Math.abs( t1[1] + t*(t2[1]-t1[1]) );   

            //line which connects the terminals: y=ax+b
            var W = t1[0] - t2[0];
            var Wa = t1[1] - t2[1];
            var Wb = t1[0]*t2[1] - t1[1]*t2[0];
            if (W !== 0) {
               a = Wa/W;
               b = Wb/W;
            }
            else {
               a = 0;
            }
            //line perpendicular to the main line: y = aProst*x + b
            if (a == 0) {
               aProst = 0;
            }
            else {
               aProst = -1/a;
            }
            bProst = z[1] - aProst*z[0]; //point z lays on this line

            //we have to calculate coordinates of 2 points, which lay on perpendicular line and have the same distance (d) from point z
            var A = 1 + Math.pow(aProst,2);
            var B = 2*aProst*bProst - 2*z[0] - 2*z[1]*aProst;
            var C = -2*z[1]*bProst + Math.pow(z[0],2) + Math.pow(z[1],2) - Math.pow(d,2) + Math.pow(bProst,2);
            var delta = Math.pow(B,2) - 4*A*C;
            if (delta < 0) { return; }

            var x1 = (-B + Math.sqrt(delta)) / (2*A);
            var x2 = (-B - Math.sqrt(delta)) / (2*A);    
            var y1 = aProst*x1 + bProst;
            var y2 = aProst*x2 + bProst;

            if(t1[1] == t2[1]) {
                 var o = (t1[0] > t2[0]) ? 1 : -1;
                  x1 = t2[0]+o*dlug;
                  x2 = x1;
                  y1 -= d;
                  y2 += d;
            }      

            if (type == 2 || type == 3) {
                this.moveTo(t2[0]+6,t2[1]+6);
                this.lineTo(x1+6,y1+6);
                this.moveTo(t2[0]+6,t2[1]+6);
                this.lineTo(x2+6,y2+6);
            }

            this.end();
        },
        changeType: function() {
            // Change and set value
            var val = this.get('val') + 1;
            if (val > 3 || val < 0) {
                val = 0;
            }
            
            this.setType(val);
        },
        setType: function(type) {            
            this.clear(); // Clear shape (force to redraw it)
            
            var val = type;
            // Change color
            if (val == 0) {
                this.get('stroke').color = 'rgb(200,200,200)';
            }
            else {
                this.get('stroke').color = 'rgb(0,0,0)';
            }
            this.set('val', val);
        },
        setText: function(text) {
            this.get('node').setAttribute('tooltip', text);
            this.set('text', text);
        }
     });
     Y.TeachingArrow.ATTRS = Y.merge(Y.Path.ATTRS, {
        /**
         * @attribute src
         */
        src: {
           value: null,
           setter: function (val) {
              if(val && Y.Lang.isFunction (val.addWire) ) {
                 val.addWire(this);
              }
              return val;
           }
        },

        /**
         * @attribute tgt
         */
        tgt: {
           value: null,
           setter: function (val) {
              if(val && Y.Lang.isFunction (val.addWire) ) {
                 val.addWire(this);
              }

              return val;
           }
        },

        /**
         * @attribute srcDir
         * @type Array
         * @default [1,0]
         */ 
        srcDir: {
           validator: Y.Lang.isArray,
           value: [1,0]
        },

        /**
         * @attribute tgtDir
         * @type Array
         * @default -srcDir
         */
        tgtDir: {
           validator: Y.Lang.isArray,
           valueFn: function () {
              var d = this.get('srcDir');
              return [-d[0],-d[1]];
           }
        },
        /**
         * @attribute id
         */
        id: {
            type: "Integer",
            value: 0
        },
        /**
         * @attribute type
         * 0: none
         * 1: normal direction
         * 2: inverse direction
         * 3: bidirectionnal
         */
        val: {
            type: "Integer",
            value: 1
        },
        /**
         * @attribute text
         */
        text: {
            type: "String",
            value: "Unknown"
        }
     });
}, '0.0.1', {"requires": ["graphics"], "skinnable": true});
