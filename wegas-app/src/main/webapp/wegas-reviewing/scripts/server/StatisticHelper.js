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
            mean, median, sd, effectiveValues,
            sortedValues, x, classSize;

        effectiveValues = [];
        for (i = 0; i < values.length; i += 1) {
            if (isNumber(values[i])) {
                effectiveValues.push(values[i]);
            }
        }

        if (!isNumber(numberOfClass)) {
            numberOfClass = 5;
            if (effectiveValues.length > 100) {
                numberOfClass = 20;
            }

        }

        if (!isNumber(min)) { // if min not provided, determine it from distribution
            min = Math.min.apply(null, effectiveValues);
        } else {
            // Otherwise, make sure min in less than distribution one
            min = Math.min(min, Math.min.apply(null, effectiveValues));
        }

        if (!isNumber(max)) { // if max not provided, detemine it from distribution
            max = Math.max.apply(null, effectiveValues);
        } else {
            // Otherwise, make sure max in greater that distribution one
            max = Math.max(max, Math.max.apply(null, effectiveValues));
        }

        classSize = (max - min) / (numberOfClass - 1);

        for (i = 0; i < numberOfClass; i += 1) {
            histogram.push({
                min: min + Math.max(0, (i - 0.5)) * classSize,
                max: Math.min(max, min + (i + 0.5) * classSize),
                count: 0
            });
        }

        mean = 0;
        for (i = 0; i < effectiveValues.length; i += 1) {
            for (k = 0; k <= numberOfClass; k += 1) {
                if (effectiveValues[i] < histogram[k].max || k === numberOfClass - 1) {
                    break;
                }
            }
            histogram[k].count += 1;
            mean += effectiveValues[i];
        }
        mean /= effectiveValues.length;

        sortedValues = effectiveValues.sort(function(a, b) {
            return a < b;
        });


        sd = 0;
        for (i = 0; i < effectiveValues.length; i += 1) {
            x = (effectiveValues[i] - mean);
            sd += x * x;
        }
        sd /= effectiveValues.length;
        sd = Math.sqrt(sd);

        if (effectiveValues.length % 2 === 1) {
            median = sortedValues[Math.floor(effectiveValues.length / 2)];
        } else {
            x = effectiveValues.length / 2;
            median = (sortedValues[x - 1] + sortedValues[x]) / 2;
        }

        return {
            numberOfValues: effectiveValues.length,
            mean: mean,
            min: min,
            max: max,
            median: median,
            sd: sd,
            histogram: histogram
        };
    }

    function getTextStatistics(text) {
        var stats,
            countEmpty = true;
        stats = {
            wc: 0,
            cc: 0
        };

        if (text) {
            // Remove ML tags
            text = text.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&[a-zA-Z]*;/g, "X");

            if (countEmpty) {
                stats.cc = text.length;
            } else {
                stats.cc = text.replace(/\s+/g, "").length;
            }
            text = text.replace(/\s+/g, " ").trim(); // TRIMLIKE
            if (text === "") {
                stats.wc = 0;
            } else {
                stats.wc = text.split(" ").length;
            }

        }

        return stats;
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
