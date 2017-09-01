/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.merge.annotations.WegasEntity;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

/**
 * Contains all WegasEntityProperty annotated fields for a given AbstractEntity class
 *
 * @author maxence
 */
public class WegasEntityFields {

    /**
     * AbstractEntity this object is related to
     */
    private final Class<? extends AbstractEntity> theClass;

    /**
     * list of WegasEntityProperty annotated fields (including inherited) defined in theClass
     */
    private final List<WegasFieldProperties> fields = new ArrayList<>();

    /**
     * List of Entity level callback defined in theClass inheritance hierarchy
     */
    private final List<WegasCallback> entityCallbacks = new ArrayList<>();

    /**
     * Fetch all WegasEntityPropertes annotated fields for theClass
     *
     * @param theClass
     */
    public WegasEntityFields(Class<? extends AbstractEntity> theClass) {
        try {
            this.theClass = theClass;


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
                        fields.add(new WegasFieldProperties(f, wegasProperty));
                    }
                }

                /*
                 * Fetch all class level WegasEntity annotations
                 */
                WegasEntity wegasEntity = (WegasEntity) klass.getAnnotation(WegasEntity.class);
                if (wegasEntity != null) {
                    Class<? extends WegasCallback> entityCallbackClass = wegasEntity.callback();

                    if (entityCallbackClass != null && !entityCallbackClass.equals(EmptyCallback.class)) {
                        this.entityCallbacks.add(entityCallbackClass.newInstance());
                    }
                }

                klass = klass.getSuperclass();
            }

        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    /**
     * The class
     *
     * @return the class which defined all those fields
     */
    public Class<? extends AbstractEntity> getTheClass() {
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

    /**
     * Get the list of all callback defined at class level for theClass
     *
     * @return all class level callbacks
     */
    public List<WegasCallback> getEntityCallbacks() {
        return entityCallbacks;
    }
}
