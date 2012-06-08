/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.script;

import javax.naming.InitialContext;
import javax.naming.NamingException;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
abstract public class Factory {

    /**
     *
     * @param name
     * @return
     * @throws NamingException
     */
    static public Object lookupBean(String name) throws NamingException {
        InitialContext ctx = new InitialContext();
        return ctx.lookup("java:module/"+name);
    }
}
