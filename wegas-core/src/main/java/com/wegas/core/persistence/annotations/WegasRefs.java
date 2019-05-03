/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.annotations;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.Mergeable;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import org.apache.commons.lang3.Validate;

/**
 * WegasReferences allow to reference fields and values
 * within {@link Errored} and {@link Validate} annotations.
 *
 * @author maxence
 */
public class WegasRefs {

    /**
     * Abstract superclass to rule them all
     */
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
    public static abstract class Ref {

        public abstract Object resolve(Object self, Mergeable object);

        public Double resolveAsDouble(Object self, Mergeable object) {
            Object o = this.resolve(self, object);
            if (o instanceof Number) {
                return ((Number) o).doubleValue();
            }
            return Double.NaN;
        }
    }

    /**
     * Resolves to any object
     */
    @JsonTypeName("Const")
    public static class Const extends Ref {

        private final Object value;

        public Const(Object value) {
            this.value = value;
        }

        public Object getConst() {
            return value;
        }

        @Override
        public Object resolve(Object self, Mergeable object) {
            return value;
        }
    }

    /**
     * Resolves to the annotated property
     */
    @JsonTypeName("Self")
    public static class Self extends Ref {

        public Self() {
        }

        @Override
        public Object resolve(Object self, Mergeable object) {
            return self;
        }
    }

    /**
     * Resolves to an object property.
     * With no classFilter provided, resolves to the property of the current object which match fieldName
     * If a classFilter is provided, the first parent of the given class is used as current object.
     */
    @JsonTypeName("Field")
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public static class Field extends Ref {

        /**
         * null of empty means the current object,
         * other values means the first parent which match the class
         */
        private final Class<? extends Mergeable> classFilter;

        /**
         * null or empty means the object itself.
         * Other values
         */
        private final String fieldName;

        public Field(Class<? extends Mergeable> classFilter, String fieldName) {
            this.classFilter = classFilter;
            this.fieldName = fieldName;
        }

        public String getFieldName() {
            return fieldName;
        }

        /**
         * Serialised class name !
         *
         * @return JSON "@class" value of the underlying classFilter
         */
        public String getClassFilter() {
            if (classFilter != null) {
                return Mergeable.getJSONClassName(classFilter);
            }
            return null;
        }

        @Override
        public Object resolve(Object self, Mergeable object) {
            Mergeable parent;
            if (classFilter != null) {
                parent = object.findNearestParent(classFilter);
            } else {
                parent = object;
            }

            if (parent != null) {
                if (Helper.isNullOrEmpty(fieldName)) {
                    return parent;
                } else {
                    try {
                        PropertyDescriptor propD = new PropertyDescriptor(fieldName, parent.getClass());
                        return propD.getReadMethod().invoke(parent);

                    } catch (IntrospectionException | IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
                        throw WegasErrorMessage.error("Filed " + fieldName + " not found in " + parent);
                    }
                }
            } else {
                throw WegasErrorMessage.error("Container " + (classFilter != null ? classFilter : "") + " not found");
            }
        }
    }
}
