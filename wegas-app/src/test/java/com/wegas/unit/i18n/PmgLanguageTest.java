/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit.i18n;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class PmgLanguageTest extends AbstractClientLanguageTest {

    @Override
    protected List<String> getScripts() {
        List<String> scripts = new ArrayList<>();
        scripts.add(SCRIPTROOT + "wegas-pmg/js/i18n/i18n-pmg-en.js");
        scripts.add(SCRIPTROOT + "wegas-pmg/js/i18n/i18n-pmg-fr.js");
        return scripts;
    }

}
