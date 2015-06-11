/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
////import javax.xml.bind.annotation.XmlRootElement;
////import javax.xml.bind.annotation.XmlTransient;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.exception.client.WegasErrorMessage;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
//@XmlRootElement
public class FileDescriptor extends AbstractContentDescriptor {

    //@XmlTransient
    @JsonIgnore
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(FileDescriptor.class);
    @JsonIgnore
    private Calendar dataLastModified;
    @JsonIgnore
    private Long bytes;

    /**
     *
     * @param absolutePath
     * @param contentConnector
     */
    public FileDescriptor(String absolutePath, ContentConnector contentConnector) {
        super(absolutePath, contentConnector);
    }

    /**
     *
     * @param absolutePath
     * @param mimeType
     * @param lastModified
     * @param bytes
     * @param contentConnector
     */
    public FileDescriptor(String absolutePath, String mimeType, Calendar lastModified, Long bytes, ContentConnector contentConnector) {
        super(absolutePath, contentConnector, mimeType);
        this.dataLastModified = lastModified;
        this.bytes = bytes;
    }

    /**
     *
     * @param name
     * @param path
     * @param contentConnector
     */
    public FileDescriptor(String name, String path, ContentConnector contentConnector) {
        super(name, path, contentConnector);
    }

    /**
     *
     * @return
     */
    //@XmlTransient
    @JsonIgnore
    public InputStream getBase64Data() {
        try {
            return connector.getData(this.fileSystemAbsolutePath);
        } catch (PathNotFoundException ex) {
            logger.debug("Node does not exist or has no content, nothing to return");
        } catch (RepositoryException ex) {
            logger.error("Something bad append, Roger!", ex);
        }
        return null;
    }

    /**
     * Attach this fileDescriptor to the content repository and writes
     * parameters to it.
     *
     * @param data The InputStream to store
     * @param mimeType The data type
     * @throws IOException
     */
    public void setBase64Data(InputStream data, String mimeType) throws IOException {
        try {
            this.mimeType = mimeType;
            this.sync();
            connector.setData(this.fileSystemAbsolutePath, mimeType, data);
            this.bytes = connector.getBytesSize(fileSystemAbsolutePath);
            if (WFSConfig.MAX_FILE_SIZE < this.bytes) {
                this.delete(true);
                throw WegasErrorMessage.error(this.getName() + "[" + ContentConnector.bytesToHumanReadable(this.bytes) + "] file max size exceeded. Max " + ContentConnector.bytesToHumanReadable(WFSConfig.MAX_FILE_SIZE));
            }
            Long totalSize = ((DirectoryDescriptor) DescriptorFactory.getDescriptor("/", connector)).getBytes();
            if (totalSize > WFSConfig.MAX_REPO_SIZE) {
                this.delete(true);
                throw WegasErrorMessage.error("Total size[" + ContentConnector.bytesToHumanReadable(totalSize) + "] exceeded. Max " + ContentConnector.bytesToHumanReadable(WFSConfig.MAX_FILE_SIZE));
            }
            this.dataLastModified = connector.getLastModified(fileSystemAbsolutePath);
            this.mimeType = mimeType;
        } catch (PathNotFoundException ex) {
            logger.error("Parent directory ({}) does not exist, considere checking the way you try to store datas", ex.getMessage());
        } catch (RepositoryException ex) {
            logger.error("Need to check this error, Roger !", ex);
        }
        data.close();
    }

    /**
     * Attach this fileDescriptor to the content repository and writes
     * parameters to it.
     *
     * @param data The String to store as data
     * @param mimeType The data type
     * @throws IOException
     */
    public void setBase64Data(String data, String mimeType) throws IOException {
        this.setBase64Data(new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8)), mimeType);
    }

    /**
     *
     * @return
     */
    @JsonProperty("dataLastModified")
    public Calendar getDataLastModified() {
        return dataLastModified;
    }

    /**
     *
     * @return
     */
    @JsonProperty("bytes")
    @Override
    public Long getBytes() {
        return bytes;
    }

    /**
     *
     * @throws RepositoryException
     */
    @Override
    public void getContentFromRepository() throws RepositoryException {
        if (this.getMimeType().equals(DirectoryDescriptor.MIME_TYPE) || this.fileSystemAbsolutePath.equals("/")) {
            //DirectorDescriptor
            throw new ClassCastException("Trying to retrieve a directory as a file");
        }
        this.dataLastModified = connector.getLastModified(fileSystemAbsolutePath);
        this.bytes = connector.getBytesSize(fileSystemAbsolutePath);
        super.getContentFromRepository();
    }

    /**
     *
     * @return @throws IOException
     */
    //@XmlTransient
    @JsonIgnore
    protected byte[] getBytesData() throws IOException {
        try {
            return connector.getBytesData(this.fileSystemAbsolutePath);
        } catch (PathNotFoundException ex) {
            logger.debug("Node does not exist or has no content, nothing to return");
        } catch (RepositoryException ex) {
            logger.error("Something bad append, Roger!", ex);
        }
        return new byte[0];
    }
}
