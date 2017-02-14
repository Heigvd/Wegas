/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.facebook;

import com.wegas.core.security.persistence.AbstractAccount;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class FacebookAccount extends AbstractAccount {

    private static final long serialVersionUID = 1L;

    @Override
    public String getEmail() {
        return null;
    }
}
