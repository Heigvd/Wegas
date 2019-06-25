/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.JSONSchema;

import com.wegas.core.persistence.annotations.Errored;
import java.util.List;

public interface WithErroreds {
    List<WrappedErrored> getErroreds();

    void addErrored(Errored errored);

}