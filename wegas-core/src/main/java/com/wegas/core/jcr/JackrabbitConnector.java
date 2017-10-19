/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.mongodb.DB;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientOptions;
import com.mongodb.ReadConcern;
import com.wegas.core.Helper;
import org.apache.jackrabbit.oak.Oak;
import org.apache.jackrabbit.oak.jcr.Jcr;
import org.apache.jackrabbit.oak.plugins.document.DocumentMK;
import org.apache.jackrabbit.oak.plugins.document.DocumentNodeStore;
import org.apache.jackrabbit.oak.segment.SegmentNodeStore;
import org.apache.jackrabbit.oak.segment.SegmentNodeStoreBuilders;
import org.apache.jackrabbit.oak.segment.file.FileStore;
import org.apache.jackrabbit.oak.segment.file.FileStoreBuilder;
import org.apache.jackrabbit.oak.segment.file.InvalidFileStoreVersionException;
import org.slf4j.LoggerFactory;

import javax.annotation.PreDestroy;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.jcr.Repository;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Jackrabbit repository init
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Singleton
@Startup
public class JackrabbitConnector {

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
}
