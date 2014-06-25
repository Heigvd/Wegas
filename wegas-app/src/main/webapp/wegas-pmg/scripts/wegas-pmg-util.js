/**
 * 
 */
Y = {
    Array: {
        each: function() {

        }
    }
};
Y.Array.unique = function(array, testFn) {
    var i = 0,
        len = array.length,
        results = [],
        j, result, resultLen, value;

    // Note the label here. It's used to jump out of the inner loop when a value
    // is not unique.
    outerLoop: for (; i < len; i++) {
        value = array[i];

        // For each value in the input array, iterate through the result array
        // and check for uniqueness against each result value.
        for (j = 0, resultLen = results.length; j < resultLen; j++) {
            result = results[j];

            // If the test function returns true or there's no test function and
            // the value equals the current result item, stop iterating over the
            // results and continue to the next value in the input array.
            if (testFn) {
                if (testFn.call(array, value, result, i, array)) {
                    continue outerLoop;
                }
            } else if (value === result) {
                continue outerLoop;
            }
        }

        // If we get this far, that means the current value is not already in
        // the result array, so add it.
        results.push(value);
    }
    return results;
};


/**
 * Transform a wegas List in an array.
 * If the wegas list contain other wegas list (and contain other wegas list, etc),
 *  put each other list at the same level in the returned one level (flat) Array.
 * @param {List} list
 * @param {List} finalList
 * @returns {Array} the given finalList, in an Array object
 */
function flattenList(list, finalList) {
    var i, el;
    finalList = (finalList) ? finalList : [];
    for (i = 0; i < list.items.size(); i++) {
        el = list.items.get(i);
        if (el.getClass() && el.getClass().toString() === 'class com.wegas.core.persistence.variable.ListDescriptor') {
            finalList = this.flattenList(el, finalList);
        } else {
            finalList.push(el);
        }
    }
    return finalList;
}