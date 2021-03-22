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
public class ReviewLanguageTest extends AbstractClientLanguageTest {

    @Override
    protected List<String> getScripts() {
        List<String> scripts = new ArrayList<>();
        scripts.add(SCRIPTROOT + "wegas-reviewing/js/i18n/i18n-review-en.js");
        scripts.add(SCRIPTROOT + "wegas-reviewing/js/i18n/i18n-review-fr.js");
        return scripts;
    }

}
