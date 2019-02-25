/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.merge.annotations.WegasEntity;
import com.wegas.core.merge.annotations.WegasEntityProperty;

/**
 * Since optional annotations require a default value, here is the default value for {@link WegasEntityProperty#callback()  property callback} and {@link WegasEntity#callback() entity callback}
 *
 * @author maxence
 */
public class EmptyCallback implements WegasCallback {
}
