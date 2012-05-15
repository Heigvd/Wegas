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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author fx
 */
public class Helper {

    private static final Logger logger = LoggerFactory.getLogger(Helper.class);

    /**
     *
     * @param <T>
     * @param context
     * @param type
     * @param service
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Context context, Class<T> type, Class service) throws NamingException {
        try {
            //   context.
            return (T) context.lookup("java:module/" + service.getSimpleName() + "!" + type.getName());
        }
        catch (NamingException ex) {
            try {
                return (T) context.lookup("java:global/classes/" + service.getSimpleName() + "!" + type.getName());
            }
            catch (NamingException ex1) {
                try {
                    return (T) context.lookup("java:global/cobertura/" + service.getSimpleName() + "!" + type.getName());
                }
                catch (NamingException ex2) {
                    logger.error("Uanble to retrieve to do jndi lookup on class: {}", type.getSimpleName());
                    throw ex2;
                }
            }
        }
    }

    /**
     *
     * @param <T>
     * @param type
     * @param service
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return lookupBy(new InitialContext(), type, service);
    }

    /**
     *
     * @param <T>
     * @param type
     * @return
     * @throws NamingException
     */
    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return lookupBy(type, type);
    }
}
