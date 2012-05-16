/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class VariableDescriptorFilter implements ResourceFilter  {

    @Override
    public ContainerRequestFilter getRequestFilter() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public ContainerResponseFilter getResponseFilter() {

        throw new UnsupportedOperationException("Not supported yet.");
    }

}
