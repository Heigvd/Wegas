/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2025 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Player;

/**
 *
 * Expose business methods related to Player
 *
 * @author Sandra
 */
public interface PlayerFacadeI {
    Player changeLanguage(Long playerId, String langCode);
}
