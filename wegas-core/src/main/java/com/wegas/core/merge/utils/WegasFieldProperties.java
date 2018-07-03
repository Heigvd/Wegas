/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.Mergeable;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * This class represent all properties linked to an {@link Mergeable} {@link WegasEntityProperty} field
 *
 * @author maxence
 */
public class WegasFieldProperties {

    /**
     * The field
     */
    private final Field field;

    /**
     * Field type
     */
    private final Class<?> fieldClass;

    /**
     * The WegasEntityProperty annotation which depicts the field as a property to merge
     */
    private final WegasEntityProperty annotation;

    /**
     * the field as a beam property
     */
    private final PropertyDescriptor propertyDescriptor;

    /**
     * Indicate what kind of field this property is
     */
    private final FieldType type;

    /**
     *
     * @param field         the field
     * @param wegasProperty its WegasPropertyAnotation
     *
     * @throws IntrospectionException should never been thrown (thanks to MergeFacadeTest.testGetterAndSetter)
     */
    WegasFieldProperties(Field field, WegasEntityProperty wegasProperty) throws IntrospectionException {
        this.field = field;
        this.fieldClass = field.getType();
        this.annotation = wegasProperty;
        this.propertyDescriptor = new PropertyDescriptor(field.getName(), field.getDeclaringClass());

        /*
         * guess field type
         */
        // Which case ?
        if (List.class.isAssignableFrom(fieldClass) || Map.class.isAssignableFrom(fieldClass) || Set.class.isAssignableFrom(fieldClass)) {
            /*
             * current property is a list or a map of abstract entities
             */
            this.type = FieldType.CHILDREN;
        } else if (Mergeable.class.isAssignableFrom(fieldClass)) {
            /*
             * the property is an abstract entity -> register patch
             */
            this.type = FieldType.CHILD;
        } else {
            // fallback -> primitive or primitive related property (eg. Boolean, List<Double>, Map<String, String>, etc)
            this.type = FieldType.PROPERTY;
        }
    }

    /**
     * Get the WegasEntityProperty annotation which define this field as an entity property which is to be merged
     *
     * @return the annotation
     */
    public WegasEntityProperty getAnnotation() {
        return annotation;
    }

    /**
     * Indicate which kind of filed it is (PROPERTY means ~primitive, Child means one Mergeable, Children means list or map of Mergeable)
     *
     * @return the field type
     */
    public FieldType getType() {
        return type;
    }

    /**
     * Return the field itself
     *
     * @return the field itself
     */
    public Field getField() {
        return field;
    }

    /**
     * The field class
     *
     * @return the field class
     */
    public Class<?> getFieldClass() {
        return fieldClass;
    }

    /**
     * PropertyDescriptor give an access to getter & setter through its getReadMethod/getWriteMethod
     *
     * @return the field views as a PropertyDescriptor
     */
    public PropertyDescriptor getPropertyDescriptor() {
        return propertyDescriptor;
    }

    /**
     * There is three different kind of properties
     * CHILD: field type is a Mergeable object
     * CHILDREN: a list or a map of children
     * PROPERTY: any other value (eg primitive types)
     */
    public static enum FieldType {
        PROPERTY,
        CHILD,
        CHILDREN
    };
}
