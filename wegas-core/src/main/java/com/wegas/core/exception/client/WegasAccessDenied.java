/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

import com.wegas.core.security.persistence.User;
import javax.ejb.ApplicationException;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@ApplicationException(rollback = true)
public class WegasAccessDenied extends WegasRuntimeException {

    private static final long serialVersionUID = -7531213166134419293L;

    private Object entity;
    private String mode;
    private User user;

    public WegasAccessDenied(Object entity, String mode, String msg, User user) {
        super(msg);
        this.entity = entity;
        this.mode = mode;
        this.user = user;
    }

    @Override
    public String toString() {
        return (mode != null ? mode : "[n/a]")
            + "Permission Denied for user "
            + (user != null ? user : "[n/a]")
            + " on "
            + (entity != null ? entity : "[n/a]");
    }
}
