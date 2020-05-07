/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

import com.wegas.core.persistence.annotations.Errored;
import java.util.List;

public interface WithErroreds {
    List<WrappedErrored> getErroreds();

    void addErrored(Errored errored);

}