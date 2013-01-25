/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb.exception;

import javax.ejb.ApplicationException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ApplicationException(rollback=false)
public class PersistenceException extends RuntimeException {

    /**
     *
     */
    public PersistenceException() {
        super();
    }

    /**
     *
     * @param cause
     */
    public PersistenceException(Throwable cause) {
        super(cause);
    }
}
