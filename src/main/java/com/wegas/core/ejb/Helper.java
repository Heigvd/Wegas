/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/  *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;

/**
 *
 * @author fx
 */
public class Helper {

    public static <T> T lookupBy(Context context, Class<T> type, Class service) throws NamingException {
        try {
            return (T) context.lookup("java:global/classes/" + service.getSimpleName() + "!" + type.getName());
        }
        catch (NamingException ex) {
            return (T) context.lookup("java:global/cobertura/" + service.getSimpleName() + "!" + type.getName());
        }
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return lookupBy(new InitialContext(), type, service);
    }
}
