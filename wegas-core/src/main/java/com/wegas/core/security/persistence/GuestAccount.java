/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class GuestAccount extends AbstractAccount {


    /**
     * @return the name
     */
    @Override
    public String getName() {
        return "Guest";
    }
}
