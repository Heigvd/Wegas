/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.wegas.exception;

import java.awt.image.RescaleOp;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

/**
 *
 * @author maxence
 */
public class ConcurrentAccessException extends WebApplicationException {
    /**
     * 
     */
    public ConcurrentAccessException(){
        super(Response.serverError().entity("Concurrent Access Error").build());
    }
}
