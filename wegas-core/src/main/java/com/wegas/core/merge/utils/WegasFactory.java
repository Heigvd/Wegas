/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.game.GameModel;
import java.lang.reflect.InvocationTargetException;

/**
 *
 * create instance
 *
 * @author maxence
 */
public interface WegasFactory {

    /**
     *
     * @param <T>
     * @param gameModel
     * @param originalObject
     *
     * @return
     *
     * @throws InstantiationException
     * @throws IllegalAccessException
     * @throws IllegalArgumentException
     * @throws InvocationTargetException
     * @throws NoSuchMethodException
     * @throws SecurityException
     */
    <T> T newInstance(GameModel gameModel, T originalObject) throws
        InstantiationException, IllegalAccessException,
        InvocationTargetException, NoSuchMethodException;
}
