/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.mongodb.DB;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientOptions;
import com.mongodb.ReadConcern;
import com.wegas.core.Helper;
import java.io.File;
import java.io.IOException;
import java.io.Serializable;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.TimeUnit;
import javax.annotation.PreDestroy;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.jcr.Repository;
import org.apache.jackrabbit.oak.Oak;
import org.apache.jackrabbit.oak.jcr.Jcr;
import org.apache.jackrabbit.oak.plugins.blob.MarkSweepGarbageCollector;
import org.apache.jackrabbit.oak.plugins.document.DocumentMK;
import org.apache.jackrabbit.oak.plugins.document.DocumentNodeStore;
import org.apache.jackrabbit.oak.plugins.document.VersionGarbageCollector;
import org.apache.jackrabbit.oak.segment.SegmentNodeStore;
import org.apache.jackrabbit.oak.segment.SegmentNodeStoreBuilders;
import org.apache.jackrabbit.oak.segment.file.FileStore;
import org.apache.jackrabbit.oak.segment.file.FileStoreBuilder;
import org.apache.jackrabbit.oak.segment.file.InvalidFileStoreVersionException;
import org.slf4j.LoggerFactory;

/**
 * Jackrabbit repository init
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Singleton
@Startup
public class JackrabbitConnector implements Serializable {

    private static final long serialVersionUID = -5038141424303299112L;

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(JackrabbitConnector.class);
    final private static String URI = Helper.getWegasProperty("jcr.repository.URI");
    private static Repository repo;
    private static DocumentNodeStore nodeStore;
    private static FileStore fileStore;

    private synchronized static void init() {
        if (JackrabbitConnector.repo == null) {
            if (Helper.isNullOrEmpty(URI)) {
                // In memory
                JackrabbitConnector.repo = new Jcr(new Oak()).createRepository();
                return;
            }
            try {
                final URI uri = new URI(URI);
                if (uri.getScheme().equals("mongodb")) {
                    // Remote
                    String hostPort = uri.getHost();
                    if (uri.getPort() > -1) {
                        hostPort += ":" + uri.getPort();
                    }
                    String dbName = uri.getPath().replaceFirst("/", "");
                    final DB db = new MongoClient(hostPort, MongoClientOptions.builder()
                            .readConcern(ReadConcern.MAJORITY)
                            .build())
                            .getDB(dbName);
                    nodeStore = new DocumentMK.Builder()
                            .setLeaseCheck(false)
                            .setMongoDB(db)
                            .getNodeStore();
                    JackrabbitConnector.repo = new Jcr(new Oak(nodeStore)).createRepository();
                } else if (uri.getScheme().equals("file")) {
                    // Local
                    try {
                        fileStore = FileStoreBuilder.fileStoreBuilder(new File(uri.getPath())).build();
                    } catch (InvalidFileStoreVersionException | IOException e) {
                        logger.error("Failed to read repository {}", uri.getPath(), e);
                        return;
                    }
                    final SegmentNodeStore segmentNodeStore = SegmentNodeStoreBuilders.builder(fileStore).build();
                    JackrabbitConnector.repo = new Jcr(new Oak(segmentNodeStore)).createRepository();
                }
            } catch (URISyntaxException | NullPointerException e) {
                logger.error("Failed to define JCR repository mode", e);
            }

        }
    }

    /**
     * @return Repository
     */
    protected static Repository getRepo() {
        if (JackrabbitConnector.repo == null) {
            JackrabbitConnector.init();
        }
        return JackrabbitConnector.repo;
    }

    @PreDestroy
    private void preDestroy() {
        if (nodeStore != null) {
            nodeStore.dispose();
        }
        if (fileStore != null) {
            fileStore.close();
        }
        nodeStore = null;
        repo = null;
        fileStore = null;
    }

    /**
     * clean old revisions
     */
    public void revisionGC() {
        logger.info("revisionGC(): OAK GarbageCollection");
        try {
            if (repo == null) {
                init();
            }
            if (nodeStore != null) {
                VersionGarbageCollector versionGc = nodeStore.getVersionGarbageCollector();
                logger.info("revisionGC(): start VersionGC");
                VersionGarbageCollector.VersionGCStats gc = versionGc.gc(1, TimeUnit.DAYS);
                logger.info("revisionGC(): versionGC done: {}", gc);
            } else {
                logger.error("nodeStore is null");
            }

        } catch (IOException ex) {
            logger.error("Error while revisionGC: {}", ex);
        }
    }

    /**
     * HAZARADOUS BEHAVIOUR: do not use unless ykwyd
     */
    public void blobsGC() {
        //ILock lock = hzInstance.getLock("JackRabbit.Schedule");
        logger.info("revisionGC(): OAK GarbageCollection");
        //if (lock.tryLock()) {
        logger.info(" * I got the lock");
        //try {
        if (repo == null) {
            init();
        }
        if (nodeStore != null) {
            // GC blobs older than 1 day (60*60*24 sec => 86400 sec => 1 day)
            MarkSweepGarbageCollector blobGC = nodeStore.createBlobGarbageCollector(60 * 60 * 24, "oak");

            if (blobGC != null) {
                try {
                    logger.info("check blob consistency");
                    long nbBlobs = blobGC.checkConsistency();
                    if (nbBlobs >= 0) {
                        logger.info("check blob consistency => {}", nbBlobs);
                    } else {
                        logger.error("check blob consistency => {}", nbBlobs);
                    }
                } catch (Exception ex) {
                    logger.error("CheckConsistency failed with {}", ex);
                }

                try {
                    logger.info("Collect Blobs garbage");
                    blobGC.collectGarbage(false);
                    logger.info("Collect Blobs garbage done");
                } catch (Exception ex) {
                    logger.error("collect blobs failed with {}", ex);
                }
            } else {
                logger.error("blobGC is null");
            }
        } else {
            logger.error("nodeStore is null");
        }

        //} finally {
        //lock.unlock();
        //lock.destroy();
        //}
        //} else {
        //logger.info("Somebody else got the lock");
        //}
    }
}
