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

import com.wegas.persistence.game.AnonymousEntity;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author maxence
 */
public class InvalidContent extends WebApplicationException {

    /**
     * 
     * @param ex
     * @param o
     */
    public InvalidContent(RuntimeException ex, AnonymousEntity o) {
        super(ex, Response.status(Response.Status.CONFLICT).entity(o).type(MediaType.APPLICATION_JSON).build());
    }

    /**
     * 
     */
    public InvalidContent() {
        super(Response.status(Response.Status.CONFLICT).build());
    }

    /**
     * 
     * @param message
     */
    public InvalidContent(String message) {
        super(Response.status(Response.Status.CONFLICT).entity(message).type(MediaType.TEXT_PLAIN).build());
    }

}
