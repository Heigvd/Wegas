/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.JSONSchema;

import com.wegas.core.persistence.annotations.WegasConditions.Condition;

public interface WithVisible {
    Condition getVisible();

    void setVisible(Condition visible);

}