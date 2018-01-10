/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.game.GameModel;
import java.lang.reflect.InvocationTargetException;


public class DefaultWegasFactory implements WegasFactory {

    @Override
    public <T> T newInstance(GameModel gameModel, T originalObject) throws IllegalAccessException, InstantiationException, IllegalArgumentException, InvocationTargetException, NoSuchMethodException {
        return (T) originalObject.getClass().getDeclaredConstructor().newInstance();
    }

}
