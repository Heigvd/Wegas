/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.wegas.editor.view.NumberView;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface WithId {

    @WegasExtraProperty(nullable = false,
            view = @View(value = NumberView.class,
                    label = "id",
                    featureLevel = ADVANCED,
                    index = -1000
            )
    )
    Long getId();
}
