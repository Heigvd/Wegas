/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit.i18n;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class McqLanguageTest extends AbstractClientLanguageTest {

    @Override
    protected List<String> getScripts() {
        List<String> scripts = new ArrayList<>();
        scripts.add(SCRIPTROOT + "wegas-mcq/js/i18n/i18n-mcq-en.js");
        scripts.add(SCRIPTROOT + "wegas-mcq/js/i18n/i18n-mcq-fr.js");
        return scripts;
    }

}
