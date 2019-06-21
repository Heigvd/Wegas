/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.Mergeable;
import java.beans.IntrospectionException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Contains all WegasEntityProperty annotated fields for a given Mergeable class
 *
 * @author maxence
 */
public class WegasEntityFields {

    public static final Logger logger = LoggerFactory.getLogger(WegasEntityFields.class);

    /**
     * Mergeable this object is related to
     */
    private final Class<? extends Mergeable> theClass;

    /**
     * list of WegasEntityProperty annotated fields (including inherited) defined in theClass
     */
    private final List<WegasFieldProperties> fields = new ArrayList<>();

    /**
     * List of Entity level callback defined in theClass inheritance hierarchy
     */
    private final List<WegasCallback> entityCallbacks = new ArrayList<>();

    private WegasFactory factory;

    /**
     * Fetch all WegasEntityPropertes annotated fields for theClass
     *
     * @param theClass
     */
    public WegasEntityFields(Class<? extends Mergeable> theClass) {
        try {
            this.theClass = theClass;

            String[] propertiesToIgnore = {};

            WegasEntity wegasEntity = (WegasEntity) theClass.getAnnotation(WegasEntity.class);
            if (wegasEntity != null) {
                propertiesToIgnore = wegasEntity.ignoreProperties();
            }

            List<String> toIgnore = new ArrayList<>(propertiesToIgnore.length);
            for (String s : propertiesToIgnore) {
                toIgnore.add(s);
            }

            /*
             * Fetch all (inherited) WegasEntity annotations and all WegasEntityProperty annotated fields
             */
            Class klass = theClass;
            while (klass != null) {

                for (Field f : klass.getDeclaredFields()) {
                    WegasEntityProperty wegasProperty = f.getDeclaredAnnotation(WegasEntityProperty.class);

                    /*
                     *  Only cares about annotated fields
                     */
                    if (wegasProperty != null) {
                        if (!toIgnore.contains(f.getName())) {
                            fields.add(new WegasFieldProperties(f, wegasProperty, theClass));
                        } else {
                            logger.trace("Ignore {}.{}", klass, f);
                        }
                    }
                }

                /*
                 * Fetch all class level WegasEntity annotations
                 */
                wegasEntity = (WegasEntity) klass.getAnnotation(WegasEntity.class);
                if (wegasEntity != null) {
                    Class<? extends WegasCallback> entityCallbackClass = wegasEntity.callback();

                    if (entityCallbackClass != null && !entityCallbackClass.equals(EmptyCallback.class)) {
                        this.entityCallbacks.add(entityCallbackClass.getDeclaredConstructor().newInstance());
                    }

                    // register the first factory as the factory to use
                    if (this.factory == null) {
                        this.factory = wegasEntity.factory().getDeclaredConstructor().newInstance();
                    }
                }

                klass = klass.getSuperclass();
            }

        } catch (IntrospectionException | IllegalAccessException | IllegalArgumentException | InstantiationException | NoSuchMethodException | SecurityException | InvocationTargetException ex) {
            throw new RuntimeException(ex);
        }
    }

    /**
     * The class
     *
     * @return the class which defined all those fields
     */
    public Class<? extends Mergeable> getTheClass() {
        return theClass;
    }

    /**
     * get the list of field belonging to theClass
     *
     * @return
     */
    public List<WegasFieldProperties> getFields() {
        return fields;
    }

    public WegasFieldProperties getField(String name) {
        for (WegasFieldProperties f : this.fields) {
            if (f.getField().getName().equals(name)) {
                return f;
            }
        }
        return null;
    }

    /**
     * Get the list of all callback defined at class level for theClass
     *
     * @return all class level callbacks
     */
    public List<WegasCallback> getEntityCallbacks() {
        return entityCallbacks;
    }

    public WegasFactory getFactory() {
        return factory;
    }
}
