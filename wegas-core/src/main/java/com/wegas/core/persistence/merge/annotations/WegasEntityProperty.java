/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.merge.annotations;

import com.wegas.core.persistence.merge.utils.EmptyCallback;
import com.wegas.core.persistence.merge.utils.WegasCallback;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 *
 * @author maxence
 */
@Target(ElementType.FIELD)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface WegasEntityProperty {

    int order() default 0;

    /**
     * Set to false to only include annotated field within the patch if the patch is recursive
     *
     * @return
     */
    boolean includeByDefault() default true;

    boolean ignoreNull() default false;
    
    /**
     * postUpdate, preDestroy, postPersist callback
     *
     * @return
     */
    Class<? extends WegasCallback> callback() default EmptyCallback.class;

    PropertyType propertyType() default PropertyType.PROPERTY;

    public enum PropertyType {
        PROPERTY,
        CHILDREN
    }
}
