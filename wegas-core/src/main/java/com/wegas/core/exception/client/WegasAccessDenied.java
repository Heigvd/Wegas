/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.persistence.User;
import javax.ejb.ApplicationException;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@ApplicationException(rollback = true)
public class WegasAccessDenied extends WegasRuntimeException {

    private static final long serialVersionUID = -7531213166134419293L;

    private AbstractEntity entity;
    private String mode;
    private User user;

    public WegasAccessDenied(AbstractEntity entity, String mode, String permissions, User user) {
        super(mode + " Permission Denied (" + permissions + ") for user " + user + " on entity " + entity);
        this.entity = entity;
        this.mode = mode;
        this.user = user;
    }
}
