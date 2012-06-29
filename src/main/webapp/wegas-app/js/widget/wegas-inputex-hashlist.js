/**
 * @module inputex-HashList
 */
YUI.add("wegas-inputex-hashlist", function(Y){

    var inputEx = Y.inputEx,
    lang = Y.Lang;

    inputEx.HashList = function(options) {
        inputEx.HashList.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.HashList, inputEx.ListField, {

        /**
         * Convert the array of 2d elements to an javascript object
         */
        seq: 2000,
        getValue: function() {
            var v = inputEx.HashList.superclass.getValue.call(this);
            var obj = {}, id;

            for(var i = 0 ; i < v.length ; i++) {
                id = v[i]["id"];
                if (!id) {
                    id = this.seq;
                    obj[id] = this.seq;
                    this.seq++;
                }
                obj[ id] = v[i];
            }
            return obj;
        },

        /**
         * Convert the object into a list of pairs
         */
        setValue: function(v) {
            var val = [];
            for(var key in v) {
                if( v.hasOwnProperty(key) ) {
                    val.push(v[key]);
                }
            }
            inputEx.HashList.superclass.setValue.call(this,val);
        }
    });

    // Register this class as "object" type
    inputEx.registerType('hashlist', inputEx.HashList);

});