/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.persistence.validation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import javax.validation.Constraint;
import javax.validation.ConstraintPayload;

/**
 *
 * @author maxence
 */
@Constraint(validatedBy=NumericRangeValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface NumericRange {
    /**
     * 
     * @return
     */
    String message() default "Range has to be valid";
    /**
     * 
     * @return
     */
    Class<?>[] groups() default {};
    /**
     * 
     * @return
     */
    Class<? extends ConstraintPayload>[] payload() default {};
}
