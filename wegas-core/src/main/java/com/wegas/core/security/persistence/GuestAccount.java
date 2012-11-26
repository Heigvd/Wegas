/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
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
