/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.annotations;

import ch.albasim.wegas.annotations.EmptyCallback;
import ch.albasim.wegas.annotations.WegasCallback;
import com.wegas.core.merge.utils.DefaultWegasFactory;
import com.wegas.core.merge.utils.WegasFactory;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 *
 * @author maxence
 */
@Target(ElementType.TYPE)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface WegasEntity {

    /**
     * postUpdate, preDestroy, postPersist callback
     *
     * @return entity level callbacks to apply
     */
    Class<? extends WegasCallback> callback() default EmptyCallback.class;

    /**
     * postUpdate, preDestroy, postPersist callback
     *
     * @return entity level callbacks to apply
     */
    Class<? extends WegasFactory> factory() default DefaultWegasFactory.class;

    /**
     * List of WegasEntityProperty to ignore.
     * Allow to ignore inherited properties
     *
     * @return list of properties to exclude from the merge process.
     */
    String[] ignoreProperties() default {};

    /*
     * depict a property ef the entity which have getter and setter but no field.
     */
    //WegasExtraProperty[] extraProperties() default {};
    /*
        with public @interface WegasExtraProperty {
            public String propertyName();
            public WegasEntityProperty property();
        }
     */
}
