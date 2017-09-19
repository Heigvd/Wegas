/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.test.AbstractEJBTest;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import javax.naming.NamingException;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 *
 * @author maxence
 */
public class ScopeTest extends AbstractEJBTest {

    @Test
    public void createVariableTest() throws NamingException {

        final NumberDescriptor myNumber = new NumberDescriptor();
        myNumber.setName("mynumber");
        myNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), myNumber);

        team = teamFacade.find(team.getId());
        team.getPrivateInstances();
        assertEquals(1, team.getPrivateInstances().size());
    }
}
