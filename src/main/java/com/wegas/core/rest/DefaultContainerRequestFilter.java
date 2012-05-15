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

import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class DefaultContainerRequestFilter implements ContainerRequestFilter  {

    @Override
    public ContainerRequest filter(ContainerRequest cr) {
        return cr;
    }

}
