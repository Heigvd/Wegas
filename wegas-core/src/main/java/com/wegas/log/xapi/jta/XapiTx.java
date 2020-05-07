/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi.jta;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.log.xapi.Xapi;
import gov.adlnet.xapi.model.Statement;
import java.io.Serializable;
import java.util.LinkedList;
import java.util.List;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import javax.ejb.PostActivate;
import javax.ejb.PrePassivate;
import javax.inject.Inject;
import javax.inject.Named;
import javax.transaction.TransactionScoped;
import javax.transaction.TransactionSynchronizationRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Transaction scoped bean for Xapi.
 * <p>
 * Wait until JTA commit to save statements
 *
 * @author maxence
 */
@Named("XapiTx")
@TransactionScoped
public class XapiTx implements Serializable {

    private static final long serialVersionUID = -1180630542160360589L;
    private static final Logger logger = LoggerFactory.getLogger(XapiTx.class);

    @Inject
    private Xapi xapi;

    /**
     * Resource to bound a XapiSync to the current transaction
     */
    @Resource
    private transient TransactionSynchronizationRegistry jtaSyncRegistry;

    /**
     * The XAPI synchroniser for the current transaction
     */
    private transient XapiSync xapiSynchronizer;

    /**
     * local store for all connectors opened during the transaction
     */
    private transient final List<Object> statements = new LinkedList<>();

    public void post(Statement statement) {
        this.statements.add(statement);
    }

    public void post(List<Statement> statements) {
        this.statements.add(statements);
    }

    /**
     * Yups... passivate means serialize. How to serialize Statements ??
     */
    @PrePassivate
    public void prePassivate() {
        logger.error("PRE PASSIVATE");
        this.rollback();
        throw WegasErrorMessage.error("NOT PASSIVABLE (a shame!)");
    }

    /**
     * See @PrePassivate note...
     */
    @PostActivate
    public void postActivate() {
        logger.error("POST ACTIVATE");
        throw WegasErrorMessage.error("NOT PASSIVABLE (a shame!)");
    }

    /**
     * As soon as this bean is construct, make sure there is a XapiSync bound to the current
     * transaction
     */
    @PostConstruct
    public void construct() {
        logger.trace("NEW TRANSACTION BEANLIFE CYCLE");
        if (jtaSyncRegistry != null && xapiSynchronizer == null) {
            xapiSynchronizer = new XapiSync(this);
            jtaSyncRegistry.registerInterposedSynchronization(xapiSynchronizer);
        } else {
            logger.trace(" * NULL -> NO-CONTEXT");
        }
    }

    public XapiSync getXapiSynchronizer() {
        return xapiSynchronizer;
    }

    /**
     * make sure changes from all opened repositories are "committable" or throw something bad
     * @throws WegasErrorMessage if commit will not be possible
     */
    protected void prepare() {
        if (!statements.isEmpty() && isLoggingEnabled()) {
            // checkink connection may be  very slow
            long start = System.currentTimeMillis();
            /**
             * try { // well, the connection seems valid // I still don't know whether I can post
             * statement or not... xapi.getClient().limitResults(1).getStatements(); } catch
             * (Exception ex) { throw WegasErrorMessage.error("XAPI: is enabled but client fails to
             * connect: " + ex); }
             */
            long step1 = System.currentTimeMillis();

            for (Object o : statements) {
                if (!(o instanceof Statement)) {
                    if (o instanceof List) {
                        for (Object item : (List) o) {
                            if (!(item instanceof Statement)) {
                                // list which contains some unwanted objects
                                throw WegasErrorMessage.error("XAPI: " + item + " is not a statement !");
                            }
                        }
                    } else {
                        // not a statement and not a list
                        throw WegasErrorMessage.error("XAPI: " + o + " is not a statement !");
                    }
                }
            }

            long step2 = System.currentTimeMillis();
            logger.trace("Xapi Prepare: skip check connection in {} ms; check statements: {}, total: {}",
                step1 - start, step2 - step1, step2 - start);
        }
    }

    /**
     * Cancel all statements
     */
    protected void rollback() {
        statements.clear();
    }

    /**
     * Commit all changes in all opened repositories
     */
    protected void commit() {
        if (!statements.isEmpty() && isLoggingEnabled()) {
            xapi.asyncPost(statements);
        }
    }

    /**
     * destroy log line...
     */
    @PreDestroy
    public void destroy() {
        logger.trace("PREDESTROY TRANSACTIONAL BEAN");
    }

    public Boolean isLoggingEnabled() {
        if (Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.auth"))
            || Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.host"))) {
            logger.warn("XAPI host/auth are not defined");
            return false;
        }
        return true;
    }
}
