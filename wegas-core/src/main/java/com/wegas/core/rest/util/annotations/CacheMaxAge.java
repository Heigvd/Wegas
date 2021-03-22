/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

/**
 * Jersey CacheMaxAge default cache controle to public, 1 day
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface CacheMaxAge {

    /**
     * Max age time default 1
     *
     * @return long
     */
    long time() default 1;

    /**
     * Max age unit default {@link java.util.concurrent.TimeUnit#DAYS}
     *
     * @return {@link java.util.concurrent.TimeUnit}
     */
    TimeUnit unit() default TimeUnit.DAYS;

    /**
     * Private cache default false
     *
     * WHAT IS IF  FOR???
     *
     * @return boolean
     */
    boolean private_cache() default false;
}
