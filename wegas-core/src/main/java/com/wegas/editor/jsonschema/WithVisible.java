/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

import com.wegas.core.persistence.annotations.WegasConditions.Condition;

public interface WithVisible {
    Condition getVisible();

    void setVisible(Condition visible);

}