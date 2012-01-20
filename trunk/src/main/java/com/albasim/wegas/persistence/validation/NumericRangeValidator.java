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

import com.albasim.wegas.persistence.type.GmDoubleType;
import com.albasim.wegas.persistence.type.GmIntegerType;
import com.albasim.wegas.persistence.GmType;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

/**
 *
 * @author maxence
 */
public class NumericRangeValidator implements ConstraintValidator<NumericRange, GmType> {

    @Override
    public void initialize(NumericRange constraintAnnotation) {
    }


    @Override
    public boolean isValid(GmType value, ConstraintValidatorContext context) {
        if (value instanceof GmIntegerType) {
            return checkInteger((GmIntegerType) value, context);
        } else if (value instanceof GmDoubleType) {
            return checkDouble((GmDoubleType) value, context);
        }
        return false;
    }


    private boolean checkInteger(GmIntegerType intN,
                                 ConstraintValidatorContext context) {

        if (intN.getMaxValue() != null && intN.getMinValue() != null) {

            int realMin = intN.isMinIncluded() ? intN.getMinValue() : intN.getMinValue() + 1;
            int realMax = intN.isMaxIncluded() ? intN.getMaxValue() : intN.getMaxValue() - 1;

            if (intN.getDefaultValue() != null) {
                Integer d = intN.getDefaultValue();
                return realMin < realMax && d >= realMin && d <= realMax;
            } else {
                return realMin < realMax;
            }
        } else if (intN.getMinValue() != null && intN.getDefaultValue() != null) {
            if (intN.isMinIncluded()) {
                return intN.getDefaultValue() >= intN.getMinValue();
            } else {
                return intN.getDefaultValue() > intN.getMinValue();
            }
        } else if (intN.getMaxValue() != null && intN.getDefaultValue() != null) {
            if (intN.isMaxIncluded()) {
                return intN.getDefaultValue() <= intN.getMaxValue();
            } else {
                return intN.getDefaultValue() < intN.getMaxValue();
            }
        }


        return true;
    }


    private boolean checkDouble(GmDoubleType dblT,
                                ConstraintValidatorContext context) {
        Double min = dblT.getMinValue();
        Double max = dblT.getMaxValue();
        Double d = dblT.getDefaultValue();

        boolean minI = dblT.isMinIncluded();
        boolean maxI = dblT.isMaxIncluded();

        if (min != null && max != null) {
            if (min >= max) {
                return false;
            }

            if (d != null) {
                if (minI && maxI) {
                    return min <= d && d <= max;
                } else if (minI) {
                    return min <= d && d < max;
                } else if (maxI) {
                    return min < d && d <= max;
                }
            }
        } else if (min != null && d != null) {
            if (minI) {
                return min <= d;
            } else {
                return min < d;
            }
        } else if (max != null && d != null) {
            if (maxI) {
                return d <= max;
            } else {
                return d < max;
            }
        }

        return true;
    }


}