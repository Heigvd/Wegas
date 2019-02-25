/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

/**
 *
 * @author maxence
 */
public interface ReadableInstance {

    Boolean isUnread();

    void setUnread(Boolean unread);

    Boolean getActive();

    void setActive(Boolean active);

    /*
    Boolean isValidated();
    void setValidated(Boolean validated);
     */
}
