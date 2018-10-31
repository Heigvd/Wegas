/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.jta;

import java.util.LinkedList;
import java.util.List;
import java.util.function.Consumer;

/**
 * Add JTA related method to JCR connectors
 *
 * @author maxence
 */
public abstract class JTARepositoryConnector {

    private List<Consumer<JTARepositoryConnector>> afterCommitCallbacks = new LinkedList<>();
    private List<Consumer<JTARepositoryConnector>> onCommitCallbacks = new LinkedList<>();
    private List<Consumer<JTARepositoryConnector>> onRollbackCallbacks = new LinkedList<>();

    /**
     * indicate whether the repository is managed or not.
     * Any changes made within a non-managed repository will never been saved!!!
     *
     * @param managed
     */
    public abstract void setManaged(boolean managed);

    /**
     * Is the repository managed.
     * Any changes made within a non-managed repository will never been saved!!!
     *
     * @return is managed ?
     */
    public abstract boolean getManaged();

    /**
     * assert all changes are valid
     */
    public abstract void prepare();

    /**
     * Rollback changed and close
     */
    public abstract void rollback();

    /**
     * Save changes to repository and close
     */
    public abstract void commit();

    public void onCommit(Consumer<JTARepositoryConnector> consumer) {
        this.onCommitCallbacks.add(consumer);
    }

    public void afterCommit(Consumer<JTARepositoryConnector> consumer) {
        this.afterCommitCallbacks.add(consumer);
    }

    public void onRollback(Consumer<JTARepositoryConnector> consumer) {
        this.onRollbackCallbacks.add(consumer);
    }

    private void run(List<Consumer<JTARepositoryConnector>> cbs) {
        for (Consumer<JTARepositoryConnector> cb : cbs) {
            cb.accept(this);
        }
    }

    protected void runAfterCommitCallbacks() {
        this.run(afterCommitCallbacks);
    }

    protected void runCommitCallbacks() {
        this.run(onCommitCallbacks);
    }

    protected void runRollbackCallbacks() {
        this.run(onRollbackCallbacks);
    }
}
