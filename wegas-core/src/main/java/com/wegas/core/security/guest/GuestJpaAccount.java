/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.guest;

import com.wegas.core.security.persistence.AbstractAccount;
import javax.persistence.*;

/**
 * Simple class that represents any User domain entity in any application.
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class GuestJpaAccount extends AbstractAccount {

    private static final long serialVersionUID = 1L;

    /**
     * @return the name
     */
    @Override
    public String getName() {
        return "Guest";
    }

    @Override
    public Boolean isVerified() {
        return false;
    }
}
