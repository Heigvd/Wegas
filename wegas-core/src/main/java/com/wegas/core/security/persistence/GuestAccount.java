/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import java.util.logging.Logger;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class GuestAccount extends AbstractAccount {

    private static final Logger logger = Logger.getLogger("Account");

    /**
     * @return the name
     */
    @Override
    public String getName() {
        return "Guest";
    }
}
