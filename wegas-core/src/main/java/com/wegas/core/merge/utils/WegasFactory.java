/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem
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

    <T> T newInstance(GameModel gameModel, T originalObject) throws
            InstantiationException, IllegalAccessException,
            IllegalArgumentException, InvocationTargetException,
            NoSuchMethodException, SecurityException;
}
