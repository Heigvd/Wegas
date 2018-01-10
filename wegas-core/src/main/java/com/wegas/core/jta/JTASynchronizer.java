/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jta;

import java.util.ArrayList;
import java.util.List;
import javax.jcr.RepositoryException;
import javax.transaction.Status;
import javax.transaction.Synchronization;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class JTASynchronizer implements Synchronization {

    private static final Logger logger = LoggerFactory.getLogger(JTASynchronizer.class);

    private final List<JCRClient> toSync = new ArrayList<>();

    private final JCRConnectorProvider txBean;

    public JTASynchronizer(JCRConnectorProvider txBean) {
        this.txBean = txBean;
    }

    @Override
    public void afterCompletion(int status) {
        String strStatus;
        switch (status) {
            case Status.STATUS_ACTIVE:
                strStatus = "ACTIVE";
                break;
            case Status.STATUS_COMMITTED:
                strStatus = "COMMITTED";
                break;
            case Status.STATUS_COMMITTING:
                strStatus = "COMMITTING";
                break;
            case Status.STATUS_MARKED_ROLLBACK:
                strStatus = "MARED_ROLLBACK";
                break;
            case Status.STATUS_NO_TRANSACTION:
                strStatus = "NO_TRANSACTION";
                break;
            case Status.STATUS_PREPARED:
                strStatus = "PREPARED";
                break;
            case Status.STATUS_PREPARING:
                strStatus = "PREPARING";
                break;
            case Status.STATUS_ROLLEDBACK:
                strStatus = "ROLLEDBACK";
                break;
            case Status.STATUS_ROLLING_BACK:
                strStatus = "ROLLING_BACK";
                break;
            case Status.STATUS_UNKNOWN:
                strStatus = "UNKNOWN";
                break;
            default:
                strStatus = "FCKN UNKNOWN";
                break;
        }
        if (status == Status.STATUS_ROLLEDBACK) {
            try {
                txBean.rollback();
            } catch (RepositoryException ex) {
                logger.error("ROLLBACK ERROR");
            }
        }
        logger.error("AFTER COMPLETION: {} => {}", status, strStatus);
    }

    @Override
    public void beforeCompletion() {
        logger.error("BEFORE COMPLETION");
        try {
            txBean.commit();
        } catch (RepositoryException ex) {
            logger.error("COMMIT ERROR");
        }
    }

    public void register(JCRClient extraJTASync) {
        if (!this.toSync.contains(extraJTASync)) {
            this.toSync.add(extraJTASync);
        }
    }

}
