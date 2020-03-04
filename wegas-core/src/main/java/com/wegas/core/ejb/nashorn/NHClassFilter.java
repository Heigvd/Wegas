/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import jdk.nashorn.api.scripting.ClassFilter;

/**
 * Well, this class filter does not filter anything but setting one prevent reflection from nashorn
 * @author maxence
 */
public class NHClassFilter implements ClassFilter {

    @Override
    public boolean exposeToScripts(String className) {
        return true;
    }
}
