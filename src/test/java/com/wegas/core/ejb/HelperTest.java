/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import java.util.ArrayList;
import java.util.List;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

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
