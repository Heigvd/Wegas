/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import java.util.Arrays;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class AlphanumericComparatorTest {

    public AlphanumericComparatorTest() {
    }

    @Test
    public void alphanumericCompare() {
        int i;
        String[] list = {
            "a1", "b", "a10", "11", "a2", "3", "a11a", "", "b", "aa1", "a10a", "a10b", "2", "1"
        }, expected = {
            "", "1", "2", "3", "11", "a1", "a2", "a10", "a10a", "a10b", "a11a", "aa1", "b", "b"
        };
        Arrays.sort(list, new AlphanumericComparator<String>());
        for (i = 0; i < list.length; i += 1) {
            Assert.assertEquals(list[i], expected[i]);
        }
    }
}
