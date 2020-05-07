/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import java.util.Date;

/**
 *
 * @author maxence
 */
public interface DatedEntity {

    Date getCreatedTime();
}
