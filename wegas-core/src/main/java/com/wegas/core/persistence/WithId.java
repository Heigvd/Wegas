/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.annotations.WegasExtraProperty;
import static com.wegas.editor.View.CommonView.FEATURE_LEVEL.ADVANCED;
import com.wegas.editor.View.ReadOnlyNumber;
import com.wegas.editor.View.View;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface WithId {

    @WegasExtraProperty(nullable = false,
            view = @View(value = ReadOnlyNumber.class,
                    label = "id",
                    featureLevel = ADVANCED,
                    index = -1000
            )
    )
    public Long getId();
}
