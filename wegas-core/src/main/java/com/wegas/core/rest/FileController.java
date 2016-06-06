/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.jcr.content.*;
import com.wegas.core.jcr.content.FileDescriptor;
import com.wegas.core.rest.util.annotations.CacheMaxAge;
import org.apache.shiro.SecurityUtils;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.slf4j.LoggerFactory;
import org.xml.sax.SAXException;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.jcr.ItemExistsException;
import javax.jcr.LoginException;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.ws.rs.*;
import javax.ws.rs.core.*;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import java.io.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipOutputStream;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}/File")
public class FileController {

    /**
     *
     */
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(FileController.class);

    static final long CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

    /**
     *
     */
    @EJB
    private GameModelFacade gmFacade;

    /**
     *
     */
    private static final String FILENAME_REGEXP = "^(?:[\\p{L}[0-9]-_ ]|\\.)+$";

    /**
     * @param gameModelId
     * @param name
     * @param note
     * @param description
     * @param path
     * @param file
     * @param details
     * @param force       ovveride
     * @return HTTP 200 if everything ok, 4xx otherwise
     * @throws RepositoryException
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{force: (force/)?}upload{directory : .*?}")
    public Response upload(@PathParam("gameModelId") Long gameModelId,
            @FormDataParam("name") String name,
            @FormDataParam("note") String note,
            @FormDataParam("description") String description,
            @PathParam("directory") String path,
            @FormDataParam("file") InputStream file,
            @FormDataParam("file") FormDataBodyPart details,
            @PathParam("force") String force) throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);
        logger.debug("File name: {}", details.getContentDisposition().getFileName());
        final Boolean override = !force.equals("");
        if (name == null) {
            name = details.getContentDisposition().getFileName();
        }
        AbstractContentDescriptor detachedFile;
        try {
            if (details.getContentDisposition().getFileName() == null
                    || details.getContentDisposition().getFileName().equals("")) {//Assuming an empty filename means a directory
                detachedFile = this.createDirectory(gameModelId, name, path, note, description);
            } else {
                detachedFile = this.createFile(gameModelId, name, path, details.getMediaType().toString(),
                        note, description, file, override);
            }
        } catch (final WegasRuntimeException ex) {
            Response.StatusType status = new Response.StatusType() {
                @Override
                public int getStatusCode() {
                    return 430;
                }

                @Override
                public Response.Status.Family getFamily() {
                    return Response.Status.Family.CLIENT_ERROR;
                }

                @Override
                public String getReasonPhrase() {
                    return ex.getLocalizedMessage();
                }
            };
            return Response.status(status).build();
        }
        return Response.ok(detachedFile, MediaType.APPLICATION_JSON).build();
    }

    /**
     * @param gameModelId
     * @param name
     * @param request
     * @param range       partial content range
     * @return the requested file with http 20x, 4xx if something went wrong
     */
    @GET
    @Path("read{absolutePath : .*?}")
    @CacheMaxAge(time = 48, unit = TimeUnit.HOURS)
    public Response read(@PathParam("gameModelId") Long gameModelId,
            @PathParam("absolutePath") String name,
            @Context Request request,
            @HeaderParam("Range") String range) {

        logger.debug("Asking file (/{})", name);
        AbstractContentDescriptor fileDescriptor;
        // ContentConnector connector = null;
        Response.ResponseBuilder response = Response.status(404);
        try (final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {

            fileDescriptor = DescriptorFactory.getDescriptor(name, connector);
            if (!SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + gameModelId)) {
                if (fileDescriptor.isInheritedPrivate()) {
                    return response.status(403).build();
                }
            }
            if (fileDescriptor instanceof FileDescriptor) {
                FileDescriptor fileD = (FileDescriptor) fileDescriptor;
                Date lastModified = fileD.getDataLastModified().getTime();
                response = request.evaluatePreconditions(lastModified);
                if (range != null && !range.isEmpty()) {
                    // PARTIAL CONTENT !
                    String[] ranges = range.split("=")[1].split("-");

                    final long from = Long.parseLong(ranges[0]);
                    long length = fileD.getLength();
                    /**
                     * Chunk media if the range upper bound is unspecified.
                     * Chrome sends "bytes=0-"
                     */
                    long to;
                    if (ranges.length == 2) {
                        to = Long.parseLong(ranges[1]);
                    } else {
                        //to = from + CHUNK_SIZE;
                        to = length - 1;
                    }
                    if (to >= length) {
                        to = length - 1;
                    }

                    final int lengthToRead;
                    if (to - from + 1 > Integer.MAX_VALUE) {
                        lengthToRead = Integer.MAX_VALUE;
                        to = from + lengthToRead;
                    } else {
                        lengthToRead = (int) (to - from + 1);
                    }

                    final String responseRange = String.format("bytes %d-%d/%d", from, to, length);

                    BufferedInputStream bis = new BufferedInputStream(fileD.getBase64Data(from, lengthToRead), 512);

                    response = Response.ok(bis).status(206);
                    response.header("Accept-Ranges", "bytes");
                    response.header("Content-Range", responseRange);
                    response.header("Content-Length", lengthToRead);
                    response.header("Content-Type", fileDescriptor.getMimeType());
                    response.header("Description", fileDescriptor.getDescription());
                } else {
                    if (response == null) {
                        response = Response.ok(new BufferedInputStream(fileD.getBase64Data(), 512));
                        response.header("Content-Type", fileDescriptor.getMimeType());
                        response.header("Description", fileDescriptor.getDescription());
                    }
                    response.lastModified(((FileDescriptor) fileDescriptor).getDataLastModified().getTime());
                }
            }
        } catch (PathNotFoundException e) {
            logger.debug("Asked path does not exist: {}", e.getMessage());
            return response.build();
        } catch (RepositoryException e) {
            logger.error("Need to check those errors", e);
            return response.build();
        }

        return response.build();
    }

    @GET
    @Path("meta{absolutePath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractContentDescriptor getMeta(@PathParam("gameModelId") Long gameModelId, @PathParam("absolutePath") String name) {
        try (final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(name, connector);
            if (!SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + gameModelId)) {
                if (descriptor.isInheritedPrivate()) {
                    SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + gameModelId);
                }
            }
            return descriptor;
        } catch (PathNotFoundException e) {
            logger.debug("Asked path does not exist: {}", e.getMessage());

        } catch (RepositoryException e) {
            logger.error("Need to check those errors", e);
        }
        return null;
    }

    /**
     * @param gameModelId
     * @param directory
     * @return list of directory content
     */
    @GET
    @Path("list{absoluteDirectoryPath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<AbstractContentDescriptor> listDirectory(@PathParam("gameModelId") Long gameModelId, @PathParam("absoluteDirectoryPath") String directory) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        logger.debug("Asking listing for directory (/{})", directory);
        try (final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {
            AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(directory, connector);
            if (!dir.exist() || dir instanceof FileDescriptor) {
                return null;
            } else if (dir instanceof DirectoryDescriptor) {
                List<AbstractContentDescriptor> ret = ((DirectoryDescriptor) dir).list();
                Collections.sort(ret, new ContentComparator());
                return ret;
            }
        } catch (LoginException ex) {
            logger.error(null, ex);
        } catch (RepositoryException ex) {
            logger.error(null, ex);
        }
        return new ArrayList<>();
    }

    /**
     * @param gameModelId
     * @return xml repository export
     * @throws RepositoryException
     * @throws IOException
     */
    @GET
    @Path("exportRawXML")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response exportXML(@PathParam("gameModelId") Long gameModelId) throws RepositoryException, IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId);
        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    connector.exportXML(output);
                } catch (RepositoryException ex) {
                    logger.error(null, ex);
                }
            }
        };
        return Response.ok(out, MediaType.APPLICATION_OCTET_STREAM).header("content-disposition",
                "attachment; filename=WEGAS_" + gmFacade.find(gameModelId).getName() + "_files.xml").build();
    }

    /**
     * @param gameModelId
     * @return gzipped XML repository export
     * @throws RepositoryException
     */
    @GET
    @Path("exportXML")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response exportGZ(@PathParam("gameModelId") Long gameModelId) throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId);
        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    try (ByteArrayOutputStream xmlStream = new ByteArrayOutputStream()) {
                        connector.exportXML(xmlStream);
                        try (GZIPOutputStream o = new GZIPOutputStream(output)) {
                            o.write(xmlStream.toByteArray());
                        }
                    }

                } catch (RepositoryException ex) {
                    logger.error(null, ex);
                }
            }
        };
        return Response.ok(out, MediaType.APPLICATION_OCTET_STREAM).header("content-disposition",
                "attachment; filename=WEGAS_" + gmFacade.find(gameModelId).getName() + "_files.xml.gz").build();
    }

    /**
     * @param gameModelId
     * @return ZIP repository export
     * @throws RepositoryException
     */
    @GET
    @Path("exportZIP")
    public Response exportZIP(@PathParam("gameModelId") Long gameModelId) throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId);
        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try (ZipOutputStream zipOutputStream = new ZipOutputStream(output)) {
                    connector.zipDirectory(zipOutputStream, "/");
                } catch (RepositoryException ex) {
                    logger.error(null, ex);
                }
            }
        };
        return Response.ok(out, "application/zip").
                header("content-disposition", "attachment; filename=WEGAS_" + gmFacade.find(gameModelId).getName() + "_files.zip").build();
    }

    /**
     * @param gameModelId
     * @param file
     * @param details
     * @return imported repository elements
     * @throws RepositoryException
     * @throws IOException
     * @throws SAXException
     * @throws ParserConfigurationException
     * @throws TransformerException
     */
    @POST
    @Path("importXML")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public List<AbstractContentDescriptor> importXML(@PathParam("gameModelId") Long gameModelId,
            @FormDataParam("file") InputStream file,
            @FormDataParam("file") FormDataBodyPart details)
            throws RepositoryException, IOException, SAXException,
            ParserConfigurationException, TransformerException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {
            switch (details.getMediaType().getSubtype()) {
                case "x-gzip":
                case "gzip":
                    try (GZIPInputStream in = new GZIPInputStream(file)) {
                        connector.importXML(in);
                    }
                    break;
                case "xml":
                    connector.importXML(file);
                    break;
                default:
                    throw WegasErrorMessage.error("Uploaded file mimetype does not match requirements [XML or Gunzip], found:"
                            + details.getMediaType().toString());
            }
            connector.save();
        } finally {
            file.close();
        }
        return this.listDirectory(gameModelId, "/");
    }

    /**
     * @param gameModelId
     * @param absolutePath
     * @param force
     * @return the destroyed element or HTTP not modified
     * @throws WegasErrorMessage when deleting a non empty directory without
     *                           force=true
     */
    @DELETE
    @Path("{force: (force/)?}delete{absolutePath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object delete(@PathParam("gameModelId") Long gameModelId,
            @PathParam("absolutePath") String absolutePath,
            @PathParam("force") String force) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        final Boolean recursive = !force.equals("");
        logger.debug("Asking delete for node ({}), force {}", absolutePath, recursive);
        try (final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(absolutePath, connector);
            if (descriptor.exist()) {
                descriptor.sync();
                if (descriptor instanceof DirectoryDescriptor && ((DirectoryDescriptor) descriptor).isRootDirectory()) {
                    return Response.notModified("Unable to erase Root Directory").build();
                }
                try {
                    descriptor.delete(recursive);
                } catch (ItemExistsException e) {
                    throw WegasErrorMessage.error(absolutePath + " is not empty, preventing removal");
                }
                return descriptor;
            } else {
                return Response.notModified("Path" + absolutePath + " does not exist").build();
            }
        } catch (RepositoryException ex) {
            logger.error("Really what append here ??", ex);
        }
        return null;
    }

    /**
     * @param tmpDescriptor
     * @param gameModelId
     * @param absolutePath
     * @return up to date descriptor
     */
    @PUT
    @Path("update{absolutePath : .*?}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractContentDescriptor update(AbstractContentDescriptor tmpDescriptor,
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("absolutePath") String absolutePath) {

        AbstractContentDescriptor descriptor;

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {

            descriptor = DescriptorFactory.getDescriptor(absolutePath, connector);
            descriptor.setNote(tmpDescriptor.getNote());
            descriptor.setDescription(tmpDescriptor.getDescription());
            descriptor.setPrivateContent(tmpDescriptor.isPrivateContent());
            descriptor.setContentToRepository();
            descriptor.getContentFromRepository();                              //Update
            return descriptor;
        } catch (RepositoryException ex) {
            logger.debug("File does not exist", ex);
        }
        return null;
    }

    /**
     * Well... underlying function not yet implemented do it by hand for now
     *
     * @param gameModelId
     */
    @DELETE
    @Path("destruct")
    public void deleteWorkspace(@PathParam("gameModelId") Long gameModelId) {

        SecurityUtils.getSubject().checkPermission("GameModel:Delete:gm" + gameModelId);

        try (final ContentConnector fileManager = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {
            fileManager.deleteWorkspace();
        } catch (LoginException ex) {
            logger.error(null, ex);
        } catch (RepositoryException ex) {
            logger.error(null, ex);
        }
    }

    /**
     * @param gameModelId
     * @param name
     * @param path
     * @param mediaType
     * @param note
     * @param description
     * @param file
     * @param override
     * @return new FileDescriptor
     * @throws RepositoryException
     */
    public FileDescriptor createFile(Long gameModelId, String name, String path, String mediaType,
            String note, String description, InputStream file, final Boolean override) throws RepositoryException {

        logger.debug("File name: {}", name);

        Pattern pattern = Pattern.compile(FILENAME_REGEXP);
        Matcher matcher = pattern.matcher(name);
        if (name.equals("") || !matcher.matches()) {
            throw WegasErrorMessage.error(name + " is not a valid filename.  Letters, numbers, whitespace or \".-_\" only.");
        }
        try (final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId)) {

            AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
            if (dir.exist()) {                                                      //directory has to exist
                FileDescriptor detachedFile = new FileDescriptor(name, path, connector);

                if (!detachedFile.exist() || override) {                                        //Node should not exist
                    detachedFile.setNote(note == null ? "" : note);
                    detachedFile.setDescription(description);
                    //TODO : check allowed mime-types
                    try {
                        detachedFile.setBase64Data(file, mediaType);
                        logger.info(name + "(" + mediaType + ") uploaded");
                        return detachedFile;
                    } catch (IOException ex) {
                        logger.error("Error reading uploaded file :", ex);
                        throw WegasErrorMessage.error("Error reading uploaded file");
                    }
                } else {
                    throw WegasErrorMessage.error(detachedFile.getPath() + name + " already exists");
                }
            } else {
                throw WegasErrorMessage.error("Parent directory " + path + " does not exist exists");
            }
        }
    }

    /**
     * @param gameModelId
     * @param name
     * @param path
     * @param note
     * @param description
     * @return the new directory
     * @throws RepositoryException
     */
    public DirectoryDescriptor createDirectory(Long gameModelId, String name, String path, String note, String description) throws RepositoryException {

        //logger.debug("Directory name: {}", name);
        Pattern pattern = Pattern.compile(FILENAME_REGEXP);
        Matcher matcher = pattern.matcher(name);
        if (name.equals("") || !matcher.matches()) {
            throw WegasErrorMessage.error(name + " is not a valid filename.");
        }
        ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId);
        AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
        if (dir.exist()) {                                                      // Directory has to exist
            DirectoryDescriptor detachedFile = new DirectoryDescriptor(name, path, connector);

            if (!detachedFile.exist()) {                                        // Node should not exist
                detachedFile.setNote(note == null ? "" : note);
                detachedFile.setDescription(description);
                detachedFile.sync();
                logger.info("Directory {} created at {}", detachedFile.getName(), detachedFile.getPath());
                return detachedFile;
            } else {
                throw WegasErrorMessage.error(detachedFile.getPath() + name + " already exists");
            }
        } else {
            throw WegasErrorMessage.error(path + " directory does not exist already exists");
        }
    }

    /**
     * @param gameModelId
     * @param path
     * @return true if the directory exists
     * @throws RepositoryException
     */
    public boolean directoryExists(Long gameModelId, String path) throws RepositoryException {
        ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId);
        AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
        return dir.exist();
    }

    /**
     * @param gameModelId
     * @param path
     * @return the file content
     * @throws WegasErrorMessage when the requested file doesn't exists
     */
    public InputStream getFile(Long gameModelId, String path) {
        logger.debug("Asking file (/{})", path);

        InputStream ret = null;
        AbstractContentDescriptor fileDescriptor = null;
        ContentConnector connector = null;
        try {
            connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModelId);
            fileDescriptor = DescriptorFactory.getDescriptor(path, connector);
        } catch (PathNotFoundException e) {
            logger.debug("Asked path does not exist: {}", e.getMessage());
            throw WegasErrorMessage.error("Directory " + path + " doest not exist");
        } catch (RepositoryException e) {
            logger.error("Need to check those errors", e);
        }
        if (fileDescriptor instanceof FileDescriptor) {
            ret = new BufferedInputStream(((FileDescriptor) fileDescriptor).getBase64Data(), 512);
            connector.save();
        }
        return ret;
    }
}
