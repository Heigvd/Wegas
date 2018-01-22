/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.jta;

/**
 * Add JTA related method to JCR connectors
 *
 * @author maxence
 */
public interface JTARepositoryConnector {

    /**
     * indicate whether the repository is managed or not.
     * Any changes made within a non-managed repository will never been saved!!!
     *
     * @param managed
     */
    public void setManaged(boolean managed);

    /**
     * Is the repository managed.
     * Any changes made within a non-managed repository will never been saved!!!
     *
     * @return is managed ?
     */
    public boolean getManaged();

    /**
     * assert all changes are valid
     */
    void prepare();

    /**
     * Rollback changed and close
     */
    void rollback();

    /**
     * Save changes to repository and close
     */
    void commit();
}
