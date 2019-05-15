/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.wegas.editor.View.View;

/**
 * A methods annotated with WegasExtryProperty will be taken into account while generating schema config for the client
 *
 * @author maxence
 */
@Target(ElementType.METHOD)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface WegasExtraProperty {

    /**
     * Property name. If empty, effective name should be extracted from method name
     *
     * @return
     */
    String name() default "";

    /**
     * Editor's view.
     */
    View view() default @View(label = ""); // @TODO Remove default value

    /**
     * Is the property optional ?
     *
     * @return
     */
    boolean optional() default false;

    /**
     * Can be null ?
     *
     * @return true is null is a valid value
     */
    boolean nullable() default false;
}
