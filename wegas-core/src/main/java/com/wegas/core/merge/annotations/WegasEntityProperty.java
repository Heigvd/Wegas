/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.annotations;

import com.wegas.core.merge.utils.EmptyCallback;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.variable.ModelScoped;
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
     * (e.g. to exclude ListDescriptor children from patch)
     *
     * @return
     */
    boolean includeByDefault() default true;

    /**
     * if set to true, patch will not set target property to null
     *
     * @return
     */
    boolean ignoreNull() default false;

    /**
     * Will only apply the patch if the target entity is the same as the entity one
     * (e.g. version)
     *
     * @return
     */
    boolean sameEntityOnly() default false;

    /**
     * Only merge property if the target property is null
     *
     * @return
     */
    public boolean initOnly() default false;

    /**
     * postUpdate, preDestroy, postPersist callback
     *
     * @return
     */
    Class<? extends WegasCallback> callback() default EmptyCallback.class;

    PropertyType propertyType() default PropertyType.PROPERTY;

    public ModelScoped.Visibility[] cascadeOverride() default {ModelScoped.Visibility.INTERNAL, ModelScoped.Visibility.PROTECTED};

    public enum PropertyType {
        PROPERTY,
        CHILDREN
    }
}
