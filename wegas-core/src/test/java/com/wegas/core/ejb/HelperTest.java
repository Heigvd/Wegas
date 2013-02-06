/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import java.util.ArrayList;
import java.util.List;
import static org.junit.Assert.assertEquals;
import org.junit.*;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class HelperTest {

    public HelperTest() {
    }

    @BeforeClass
    public static void setUpClass() {
    }

    @AfterClass
    public static void tearDownClass() {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    /**
     * Test of buildUniqueName method, of class Helper.
     */
    @Test
    public void testBuildName() {
        System.out.println("buildName");
        List<String> unavailableNames = new ArrayList<>();
        unavailableNames.add("test");
        unavailableNames.add("test_1");
        unavailableNames.add("test_3");
        unavailableNames.add("_1");
        unavailableNames.add("_2_1");
        unavailableNames.add("Test");
        assertEquals("thisIsATest", Helper.buildUniqueName("This is a test", unavailableNames));
        assertEquals("john_sTest", Helper.buildUniqueName("John's test", unavailableNames));
        assertEquals("camelCase", Helper.buildUniqueName("CamelCase", unavailableNames));
        assertEquals("test_2", Helper.buildUniqueName("Test", unavailableNames));
        assertEquals("_1_1", Helper.buildUniqueName("1", unavailableNames));
        assertEquals("_2_2", Helper.buildUniqueName("2_1", unavailableNames));
    }
}
