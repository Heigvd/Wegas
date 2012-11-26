/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.jcr.content;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonProperty;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@XmlRootElement
public class FileDescriptor extends AbstractContentDescriptor {

    @XmlTransient
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(FileDescriptor.class);
    @JsonIgnore
    private Calendar dataLastModified;
    @JsonIgnore
    private Long bytes;

    public FileDescriptor(String absolutePath, ContentConnector contentConnector) {
        super(absolutePath, contentConnector);
    }

    public FileDescriptor(String absolutePath, String mimeType, Calendar lastModified, Long bytes, ContentConnector contentConnector) {
        super(absolutePath, contentConnector, mimeType);
        this.dataLastModified = lastModified;
        this.bytes = bytes;
    }

    public FileDescriptor(String name, String path, ContentConnector contentConnector) {
        super(name, path, contentConnector);
    }

    @XmlTransient
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
            this.sync();
            connector.setData(this.fileSystemAbsolutePath, mimeType, data);
            this.bytes = connector.getSize(fileSystemAbsolutePath);
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
        this.setBase64Data(new ByteArrayInputStream(data.getBytes()), mimeType);
    }

    @JsonProperty("dataLastModified")
    public Calendar getDataLastModified() {
        return dataLastModified;
    }

    @JsonProperty("bytes")
    public Long getBytes() {
        return bytes;
    }

    @Override
    public void getContentFromRepository() throws RepositoryException {
        if (this.getMimeType().equals(DirectoryDescriptor.MIME_TYPE) || this.fileSystemAbsolutePath.equals("/")) {
            //DirectorDescriptor
            throw new ClassCastException("Trying to retrieve a directory as a file");
        }
        this.dataLastModified = connector.getLastModified(fileSystemAbsolutePath);
        this.bytes = connector.getSize(fileSystemAbsolutePath);
        super.getContentFromRepository();
    }

    @XmlTransient
    protected byte[] getBytesData() throws IOException {
        try {
            return connector.getBytesData(this.fileSystemAbsolutePath);
        } catch (PathNotFoundException ex) {
            logger.debug("Node does not exist or has no content, nothing to return");
        } catch (RepositoryException ex) {
            logger.error("Something bad append, Roger!", ex);
        }
        return null;
    }
}
