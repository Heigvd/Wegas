/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Calendar;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import org.apache.commons.lang3.ArrayUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class FileDescriptor extends AbstractContentDescriptor {

    static final private Logger logger = LoggerFactory.getLogger(FileDescriptor.class);

    @JsonIgnore
    @WegasEntityProperty(includeByDefault = false)
    private Calendar dataLastModified;

    /**
     * File size in bytes
     */
    @JsonIgnore
    private Long bytes;

    /**
     * Some ghost field (since not yet possible to define a WegasEntityProperty without a corresponding field)
     */
    @JsonIgnore
    @WegasEntityProperty(includeByDefault = false)
    private FileContent data; // TODO -> allow to define such a transient field withen the WegasEntity class anotation extraProperties = {@WegasEntityProperty + name}

    /**
     * @param absolutePath
     * @param contentConnector
     */
    public FileDescriptor(String absolutePath, ContentConnector contentConnector) {
        super(absolutePath, contentConnector);
    }

    /**
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
     * @param name
     * @param path
     * @param contentConnector
     */
    public FileDescriptor(String name, String path, ContentConnector contentConnector) {
        super(name, path, contentConnector);
    }

    @JsonIgnore
    public long getLength() {
        try {
            return getConnector().getLength(this.fileSystemAbsolutePath);
        } catch (PathNotFoundException ex) {
            logger.debug("Node does not exist or has no content, nothing to return");
        } catch (RepositoryException ex) {
            logger.error("Something bad append, Roger!", ex);
        }
        return 0L;
    }

    /**
     * @param from
     * @param len
     *
     * @return file parital content as Base64 within an inputStream
     */
    @JsonIgnore
    public InputStream getBase64Data(long from, int len) {
        try {
            return getConnector().getData(this.fileSystemAbsolutePath, from, len);
        } catch (PathNotFoundException ex) {
            logger.debug("Node does not exist or has no content, nothing to return");
        } catch (RepositoryException | IOException ex) {
            logger.error("Something bad append, Roger!", ex);
        }
        return null;
    }

    /**
     * @return file content as Base64 within an inputStream
     */
    @JsonIgnore
    public InputStream getBase64Data() {
        try {
            return getConnector().getData(this.fileSystemAbsolutePath);
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
     * @param data     The InputStream to store
     * @param mimeType The data type
     *
     * @throws IOException
     */
    public void setBase64Data(InputStream data, String mimeType) throws IOException {
        try {
            this.mimeType = mimeType;
            this.sync();
            ContentConnector c = getConnector();
            c.setData(this.fileSystemAbsolutePath, mimeType, data);
            this.bytes = c.getBytesSize(fileSystemAbsolutePath);
            if (WFSConfig.MAX_FILE_SIZE < this.bytes) {
                this.delete(true);
                throw WegasErrorMessage.error(this.getName() + "[" + ContentConnector.bytesToHumanReadable(this.bytes) + "] file max size exceeded. Max " + ContentConnector.bytesToHumanReadable(WFSConfig.MAX_FILE_SIZE));
            }
            Long totalSize = DescriptorFactory.getDescriptor("/", c).getBytes();
            if (totalSize > WFSConfig.MAX_REPO_SIZE) {
                this.delete(true);
                throw WegasErrorMessage.error("Exceeds total files storage capacity for this scenario [" + ContentConnector.bytesToHumanReadable(totalSize) + "/" + ContentConnector.bytesToHumanReadable(WFSConfig.MAX_REPO_SIZE) + "].");
            }
            this.dataLastModified = c.getLastModified(fileSystemAbsolutePath);
            this.mimeType = mimeType;
        } catch (PathNotFoundException ex) {
            logger.error("Parent directory ({}) does not exist, consider checking the way you try to store datas", ex.getMessage());
        } catch (RepositoryException ex) {
            logger.error("Need to check this error, Roger !", ex);
        }
        data.close();
    }

    /**
     * Attach this fileDescriptor to the content repository and writes
     * parameters to it.
     *
     * @param data     The String to store as data
     * @param mimeType The data type
     *
     * @throws IOException
     */
    public void setBase64Data(String data, String mimeType) throws IOException {
        this.setBase64Data(new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8)), mimeType);
    }

    /**
     * @return last modified date
     */
    @JsonProperty("dataLastModified")
    public Calendar getDataLastModified() {
        return dataLastModified;
    }

    @JsonProperty("dataLastModified")
    public void setDataLastModified(Calendar date) {
        this.dataLastModified = date;
        try {
            getConnector().setLastModified(fileSystemAbsolutePath, dataLastModified);
        } catch (RepositoryException ex) {
        }
    }

    /**
     * @return file content as bytes
     */
    @JsonProperty("bytes")
    @Override
    public Long getBytes() {
        return bytes;
    }

    /**
     * @throws RepositoryException
     */
    @Override
    public void getContentFromRepository() throws RepositoryException {
        if (this.getMimeType().equals(DirectoryDescriptor.MIME_TYPE) || this.fileSystemAbsolutePath.equals("/")) {
            //DirectorDescriptor
            throw new ClassCastException("Trying to retrieve a directory as a file");
        }
        this.dataLastModified = getConnector().getLastModified(fileSystemAbsolutePath);
        this.bytes = getConnector().getBytesSize(fileSystemAbsolutePath);
        super.getContentFromRepository();
    }

    @Override
    public void setContentToRepository() throws RepositoryException {
        getConnector().setLastModified(fileSystemAbsolutePath, dataLastModified);
        super.setContentToRepository();
    }

    /**
     * @return @throws IOException
     */
    @JsonIgnore
    public byte[] getBytesData() throws IOException {
        try {
            return getConnector().getBytesData(this.fileSystemAbsolutePath);
        } catch (PathNotFoundException ex) {
            logger.debug("Node does not exist or has no content, nothing to return");
        } catch (RepositoryException ex) {
            logger.error("Something bad append, Roger!", ex);
        }
        return ArrayUtils.EMPTY_BYTE_ARRAY;
    }

    public void setBytesData(byte[] bytesData) throws RepositoryException {
        getConnector().setData(this.fileSystemAbsolutePath, bytesData);
    }

    @JsonIgnore
    public FileContent getData() throws IOException {
        return new FileContent(this.getBytesData());
    }

    @JsonIgnore
    public void setData(FileContent data) throws RepositoryException {
        this.setBytesData(data.getContent());
    }

    /**
     * File content purpose is to define equals methods against the content
     */
    public static class FileContent {

        private byte[] content;

        public FileContent(byte[] content) {
            this.content = Arrays.copyOf(content, content.length);
        }

        public byte[] getContent() {
            return Arrays.copyOf(content, content.length);
        }

        public void setContent(byte[] content) {
            this.content = Arrays.copyOf(content, content.length);
        }

        @Override
        public int hashCode() {
            int hash = 7;
            hash += 23 * hash + Arrays.hashCode(content);
            return hash;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) {
                return true;
            }
            if (obj == null) {
                return false;
            }
            if (this.getClass() != obj.getClass()) {
                return false;
            }
            final FileContent other = (FileContent) obj;
            return Arrays.equals(content, other.content);
        }
    }
}
