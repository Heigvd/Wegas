/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ListUtilsTest {
    
    public ListUtilsTest() {
    }

    /**
     * Test of mergeLists method, of class ListUtils.
     */
    @Test
    public void testMergeLists() throws NoSuchFieldException, IllegalArgumentException, IllegalAccessException {
        System.out.println("mergeLists");
        NumberInstance num1 = new NumberInstance(10);
        Field name = VariableInstance.class.getDeclaredField("id");             // make "id" accessible
        name.setAccessible(true);
        name.set(num1, 1L);
        assert num1.getId().equals(1L);
        List<NumberInstance> expResult = new ArrayList<>();
        expResult.add(num1);
        List<NumberInstance> result = ListUtils.mergeLists(new ArrayList<NumberInstance>(), expResult);
        assertEquals(expResult.size(), result.size());  
        assertEquals(10, result.get(0).getValue(), 0);
        assertEquals(null, result.get(0).getId());
    }
}