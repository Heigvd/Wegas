/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.annotations;

import ch.albasim.wegas.annotations.JSONSchema;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.UndefinedSchema;
import ch.albasim.wegas.annotations.ValueGenerator;
import ch.albasim.wegas.annotations.ValueGenerator.Undefined;
import ch.albasim.wegas.annotations.View;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * To provide additional information about a {@link Scriptable} method parameter.
 *
 * @author maxence
 */
@Target(ElementType.PARAMETER)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface Param {

    Class<? extends JSONSchema> schema() default UndefinedSchema.class;

    View view() default @View(label = "");

    boolean nullable() default false;

    Class<? extends ValueGenerator> proposal() default Undefined.class;
}
