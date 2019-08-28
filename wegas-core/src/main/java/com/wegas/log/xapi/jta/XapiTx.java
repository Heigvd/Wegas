/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi.jta;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import gov.adlnet.xapi.client.StatementClient;
import gov.adlnet.xapi.model.Statement;
import gov.adlnet.xapi.util.Base64;
import java.io.IOException;
import java.io.Serializable;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import javax.ejb.PostActivate;
import javax.ejb.PrePassivate;
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
     * As soon as this bean is construct, make sure there is a XapiSync bound to the current transaction
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
     */
    protected void prepare() throws RuntimeException {
        if (isLoggingEnabled() && !statements.isEmpty()) {

            try {
                // well, the connection seems valid
                // I still don't know whether I can post statement or not...
                getClient().limitResults(1).getStatements();
            } catch (Exception ex) {
                throw WegasErrorMessage.error("XAPI: is enabled but client fails to connect: " + ex);
            }

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
        }
    }

    /**
     * Cancel all statements
     */
    protected void rollback() {
        statements.clear();;
    }

    private StatementClient getClient() throws MalformedURLException {

        String host = Helper.getWegasProperty("xapi.host");
        String token = Helper.getWegasProperty("xapi.auth");

        /**
         * Bug in client when using token +filterWith...
         */
        byte[] bytes = Base64.decode(token, Base64.DEFAULT);
        String decoded = new String(bytes, StandardCharsets.US_ASCII);

        String user;
        String password;

        int indexOf = decoded.indexOf(":");

        if (indexOf <= 0) {
            throw new MalformedURLException("Authorization token is invalid");
        } else {
            user = decoded.substring(0, indexOf);
            password = decoded.substring(indexOf + 1);
        }

        return new StatementClient(host, user, password);
    }

    /**
     * Commit all changes in all opened repositories
     */
    protected void commit() {
        if (isLoggingEnabled()) {
            try {
                if (!statements.isEmpty()) {
                    logger.trace("XAPI Tx Commit");

                    StatementClient client = this.getClient();

                    for (Object o : statements) {
                        if (o instanceof Statement) {
                            try {
                                client.postStatement((Statement) o);
                            } catch (IOException ex) {
                                logger.error("XapiTx postStatement on commit error: {}", ex);
                            }
                        } else if (o instanceof ArrayList) {
                            ArrayList<Statement> list = (ArrayList<Statement>) o;
                            try {
                                client.postStatements(list);
                            } catch (IOException ex) {
                                logger.error("XapiTx postStatements on commit error: {}", ex);
                            }
                        }
                    }
                    statements.clear();
                }
            } catch (MalformedURLException ex) {
                logger.error("XapiTx getClient error: {}", ex);
            }
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
