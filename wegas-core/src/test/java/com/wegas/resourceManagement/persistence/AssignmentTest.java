/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import java.io.IOException;
import org.junit.After;
import static org.junit.Assert.*;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class AssignmentTest {

    public AssignmentTest() {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    @Test
    public void testUnmarshall() throws IOException {
        ObjectMapper om = new ObjectMapper();
        ObjectReader reader = om.reader(Assignment.class);
        Assignment a = reader.readValue("{\"@class\":\"Assignment\",\"taskDescriptor\":{\"id\":12908,\"@class\":\"TaskDescriptor\",\"label\":\"lbl\",\"comments\":\"comments\",\"name\":\"name\",\"scope\":{\"@class\":\"TeamScope\"},\"defaultInstance\":null,\"title\":\"\",\"index\":1,\"predecessorNames\":[],\"properties\":{}}}");

        Long eId = 12908L;
        assertEquals(eId, a.getTaskDescriptorId());
    }

}
