/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.i18n.persistence.TranslatableContent;

/**
 * Displayed entity name (in addition to internal entity name)
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface LabelledEntity extends NamedEntity, WithId {

    /**
     * Get the entity label. Label is the name to be displayed to end-users
     *
     * @return entity label
     */
    TranslatableContent getLabel();

    /**
     * Set entity label
     *
     * @param newLabel the new label to set
     */
    void setLabel(TranslatableContent newLabel);
}
