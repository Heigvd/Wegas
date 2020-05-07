/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.game.GameModel;
import java.lang.reflect.InvocationTargetException;

public class DefaultWegasFactory implements WegasFactory {

    /**
     *
     * @param <T>
     * @param gameModel
     * @param originalObject
     *
     * @return
     *
     * @throws IllegalAccessException
     * @throws InstantiationException
     * @throws IllegalArgumentException
     * @throws InvocationTargetException
     * @throws NoSuchMethodException
     */
    @Override
    public <T> T newInstance(GameModel gameModel, T originalObject) throws IllegalAccessException,
        InstantiationException, InvocationTargetException, NoSuchMethodException {
        return (T) originalObject.getClass().getDeclaredConstructor().newInstance();
    }

}
