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
package com.wegas.persistence.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

/**
 *
 * @author maxence
 */
public class NumericRangeValidator implements ConstraintValidator<NumericRange, Integer> {

    @Override
    public void initialize(NumericRange constraintAnnotation) {
    }


    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        return false;
    }


    private boolean checkInteger(Integer intN,
                                 ConstraintValidatorContext context) {



        return true;
    }


    private boolean checkDouble(Integer dblT,
                                ConstraintValidatorContext context) {

        return true;
    }


}