 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import javax.inject.Inject;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;
import javax.persistence.PreRemove;
import org.eclipse.persistence.Version;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class EntityListener {

    private static final Logger logger = LoggerFactory.getLogger(EntityListener.class);

    @Inject
    private RequestManager requestManager;

    @PostPersist
    void onPostPersist(Object o) {
        logger.error("POST PERSIST: " + o);
    }

    @PostUpdate
    void onPostUpdate(Object o) {

        Class<?> myClass;
        try {
            myClass = Class.forName("org.eclipse.persistence.Version");
            Method myMethod = myClass.getMethod("getVersion");
            String version = myMethod.invoke(null).toString();
            logger.error("ECLIPSE LINK: " + version);
        } catch (ClassNotFoundException | NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
            logger.error("EXCEPTION");
        }
        logger.error("PostUpdate: " + o);
        if (o instanceof Broadcastable && o instanceof AbstractEntity) {
            Broadcastable b = (Broadcastable) o;
            Map<String, List<AbstractEntity>> entities = b.getEntities();
            requestManager.addUpdatedEntities(entities);
        }
    }

    @PreRemove
    void onPreRemove(Object o) {
        logger.error("PreRemove: " + o);
    }
}
