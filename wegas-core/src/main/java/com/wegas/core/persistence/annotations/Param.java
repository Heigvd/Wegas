/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.annotations;

import com.wegas.editor.ValueGenerators.Undefined;
import com.wegas.editor.ValueGenerators.ValueGenerator;
import com.wegas.editor.View.View;
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

    View view() default @View(label = "");

    boolean nullable() default false;

    Class<? extends ValueGenerator> proposal() default Undefined.class;
}
