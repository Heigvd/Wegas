/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Team;

/**
 *
 * Expose business methods related to Team
 *
 * @author P-B
 */
public interface TeamFacadeI {
    Team find(final Long entityId);
}
