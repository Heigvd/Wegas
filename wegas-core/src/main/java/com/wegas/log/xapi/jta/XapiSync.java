/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi.jta;

import javax.transaction.Status;
import javax.transaction.Synchronization;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * JTA synchronisation for Xapi
 *
 * @author maxence
 */
public class XapiSync implements Synchronization {

    private static final Logger logger = LoggerFactory.getLogger(XapiSync.class);

    /**
     * the XapiTx which is in charge for the current transaction
     */
    private final XapiTx xapiTx;

    /**
     * New XapiSync linked to the current transaction.
     *
     * @param context XapiConnectorProviderTx which is in charge for the current transaction
     */
    public XapiSync(XapiTx context) {
        this.xapiTx = context;
    }

    /**
     * At this point, the final state of the transaction in known.
     * <p>
     * From this point, any committed changes will be available to other transactions,
     * and any rolled back changes will be definitely loosed.
     *
     *
     * @param status status of the current transaction, either STATUS_COMMITTED or STATUS_ROLLEDBACK
     */
    @Override
    public void afterCompletion(int status) {
        String strStatus;
        switch (status) {
            case Status.STATUS_COMMITTED:
                strStatus = "COMMITTED";
                xapiTx.commit();
                break;
            case Status.STATUS_ROLLEDBACK:
                strStatus = "ROLLEDBACK";
                xapiTx.rollback();
                break;
            default:
                strStatus = "UNKNOWN";
                break;
        }

        logger.trace("XAPI Sync afterCompletion: {} => {}", status, strStatus);
    }

    /**
     * This is called before just before the commit occurs.
     * <p>
     * A RuntimeException may be thrown if there is any problem with the underling Xapi repository.
     * If so, the transaction will be rolled back
     */
    @Override
    public void beforeCompletion() {
        logger.trace("XAPI Sync beforeCompletion");
        // make sure the commit will success or throw some Runtimeexception
        xapiTx.prepare();
    }
}
