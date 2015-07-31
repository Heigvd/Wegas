/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */


/**
 * StatisticHelper
 *
 * @fileoverview
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
/*global Variable, gameModel, print, Java, javax, com, Infinity*/
var StatisticHelper = (function() {
    "use strict";

    function isNumber(x) {
        return typeof x === "number" && x !== Infinity && x !== -Infinity;
    }

    /*
     * { 
     *  min: given parameter or min value in values
     *  max: given parameter or max value in values
     *  mean: arithnmetic mean
     *  median: median value
     *  sd: σ, standard-deviation
     *  histogram: [{
     *          min: lower bound, included
     *          max: upper bound, excluded
     *          count: number of occurence
     *      }, {...}
     *      ]
     * }
     */
    function getNumericStatistics(values, min, max, numberOfClass) {
        var i, histogram = [], k,
            mean, median, sd,
            sortedValues, x, classSize;

        if (!isNumber(numberOfClass)) {
            numberOfClass = 5;
            if (values.length > 100) {
                numberOfClass = 20;
            }

        }

        if (!isNumber(min)) { // if min not provided, determine it from distribution
            min = Math.min.apply(null, values);
        } else {
            // Otherwise, make sure min in less than distribution one
            min = Math.min(min, Math.min.apply(null, values));
        }

        if (!isNumber(max)) { // if max not provided, detemine it from distribution
            max = Math.max.apply(null, values);
        } else {
            // Otherwise, make sure max in greater that distribution one
            max = Math.max(max, Math.max.apply(null, values));
        }

        classSize = (max - min) / (numberOfClass - 1);

        for (i = 0; i < numberOfClass; i += 1) {
            histogram.push({
                min: min + Math.max(0, (i - 0.5)) * classSize,
                max: Math.min(max, min + (i + 0.5) * classSize),
                count: 0
            });
        }
        sortedValues = values.sort(function(a, b) {
            return a < b;
        });

        mean = 0;
        for (i = 0; i < values.length; i += 1) {
            for (k = 0; k < numberOfClass; k += 1) {
                if (values[i] < histogram[k].max || k === numberOfClass - 1) {
                    break;
                }
            }
            //k = Math.floor((values[i] - min) / classSize);
            histogram[k].count += 1;
            mean += values[i];
        }
        mean /= values.length;

        sd = 0;
        for (i = 0; i < values.length; i += 1) {
            x = (values[i] - mean);
            sd += x * x;
        }
        sd /= values.length;
        sd = Math.sqrt(sd);

        if (values.length % 2 === 1) {
            median = sortedValues[Math.floor(values.length / 2)];
        } else {
            x = values.length / 2;
            median = (sortedValues[x - 1] + sortedValues[x]) / 2;
        }

        return {
            numberOfValues: values.length,
            mean: mean,
            min: min,
            max: max,
            median: median,
            sd: sd,
            histogram: histogram
        };
    }

    function getTextStatistics(text) {
        var wc, cc;

        text.split();

        cc = text.replace(/\s+/g, "").length;
        wc = text.replace(/(^\s*)|(\s*$)/gi, "").split(/\s+/).length;

        return {
            wc: wc,
            cc: cc
        };
    }


    return {
        isNumber: function(x) {
            return isNumber(x);
        },
        getTextStatistics: function(text) {
            return getTextStatistics(text);
        },
        getNumericStatistics: function(values, min, max, numberOfClass) {
            return getNumericStatistics(values, min, max, numberOfClass);
        }
    };

}());
