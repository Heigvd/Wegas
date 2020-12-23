/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core;

import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
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
        Arrays.sort(list, new AlphanumericComparator<>());
        for (i = 0; i < list.length; i += 1) {
            Assertions.assertEquals(list[i], expected[i]);
        }
    }
}
