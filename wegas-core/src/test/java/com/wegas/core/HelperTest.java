/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import static org.junit.Assert.assertEquals;
import org.junit.*;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class HelperTest {


    @Test
    public void testStripLabelSuffix() {
        System.out.println("stripLabelSuffix");
        assertEquals("test1String", Helper.stripLabelSuffix("test1String(32)"));
        assertEquals("test(1String)", Helper.stripLabelSuffix("test(1String)(32)"));
        assertEquals("test(1String32)", Helper.stripLabelSuffix("test(1String32)"));
        assertEquals("test1String(3s2)", Helper.stripLabelSuffix("test1String(3s2)"));
    }

    @Test
    public void testGetLabelSuffix() {
        System.out.println("getLabelSuffix");
        assertEquals(32, Helper.getLabelSuffix("test1String(32)"));
        assertEquals(32, Helper.getLabelSuffix("test(1String)(32)"));
        assertEquals(0, Helper.getLabelSuffix("test(1String32)"));
    }

    @Test
    public void testEncodeVariableName() {
        System.out.println("encodeVariableName");
        assertEquals("testEncode", Helper.encodeVariableName("test encode"));
        assertEquals("a4", Helper.encodeVariableName("a 4"));
        assertEquals("_5Test1", Helper.encodeVariableName("5 test 1"));
        try {
            Helper.encodeVariableName(null);
        } catch (Throwable t) {
            assertEquals(NullPointerException.class, t.getClass());
        }
        try {
            Helper.encodeVariableName("");
        } catch (Throwable t) {
            assertEquals(NullPointerException.class, t.getClass());
        }
    }
}
