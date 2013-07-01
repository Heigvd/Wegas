/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.guest;

import com.wegas.core.security.persistence.AbstractAccount;
import javax.persistence.*;

/**
 * Simple class that represents any User domain entity in any application.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class GuestJpaAccount extends AbstractAccount {

    /**
     * @return the name
     */
    @Override
    public String getName() {
        return "Guest";
    }
}
