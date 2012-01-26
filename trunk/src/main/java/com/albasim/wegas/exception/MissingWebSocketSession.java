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
package com.albasim.wegas.exception;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

/**
 *
 * @author maxence
 */
public class MissingWebSocketSession extends WebApplicationException {
    /**
     * 
     */
    public MissingWebSocketSession(){
        super(Response.serverError().entity("Please create a comet session -> /cometListener.html || /cs").build());
    }
}
