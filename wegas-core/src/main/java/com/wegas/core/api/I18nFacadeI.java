/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Player;

/**
 *
 * @author maxence
 */
public interface I18nFacadeI {

    public String interpolate(String str, Player player);
}
