
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.JCRFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnector.WorkspaceType;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.FileDescriptor;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.persistence.game.GameModel;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipOutputStream;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.SAXException;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}/File")
public class FileController {

    /**
     *
     */
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    /**
     *
     */
    @Inject
    private GameModelFacade gmFacade;

    @Inject
    private JCRFacade jcrFacade;

    @Inject
    private RequestManager requestManager;

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private JCRConnectorProvider jCRConnectorProvider;

    private ContentConnector getContentConnector(long gameModelId) throws RepositoryException {
        // find the gameModel to check readRight
        GameModel find = gameModelFacade.find(gameModelId);
        return jCRConnectorProvider.getContentConnector(find, WorkspaceType.FILES);
    }

    @POST
    @Path("mkdir{directory : .*?}")
    public Response mkdir(@PathParam("gameModelId") Long gameModelId,
        @PathParam("directory") String path) throws RepositoryException {

        GameModel gameModel = gameModelFacade.find(gameModelId);

        jcrFacade.assertPathWriteRight(gameModel, path);
        jcrFacade.createDirectoryWithParents(gameModel, WorkspaceType.FILES, path);
        //requestManager.assertUpdateRight(gameModel);
        return Response.noContent().build();
    }

    /**
     * @param gameModelId
     * @param name
     * @param note
     * @param description
     * @param path
     * @param file
     * @param details
     * @param force       override
     *
     * @return HTTP 200 if everything OK, 4xx otherwise
     *
     * @throws RepositoryException
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{force: (force/)?}upload{directory : .*?}")
    public Response upload(@PathParam("gameModelId") Long gameModelId,
        @FormDataParam("name") String oName,
        @FormDataParam("note") String note,
        @FormDataParam("description") String description,
        @PathParam("directory") String path,
        @FormDataParam("file") InputStream file,
        @FormDataParam("file") FormDataBodyPart details,
        @PathParam("force") String force) throws RepositoryException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        jcrFacade.assertPathWriteRight(gameModel, path);

        logger.debug("File name: {}", details.getContentDisposition().getFileName());
        final Boolean override = !force.equals("");
        String name = oName;
        if (name == null) {
            byte[] bytes = details.getContentDisposition().getFileName().getBytes(StandardCharsets.ISO_8859_1);
            name = new String(bytes, StandardCharsets.UTF_8);
        }
        AbstractContentDescriptor detachedFile;
        //try {
        if (details.getContentDisposition().getFileName() == null
            || details.getContentDisposition().getFileName().equals("")) {//Assuming an empty filename means a directory
            detachedFile = jcrFacade.createDirectory(gameModel, WorkspaceType.FILES, name, path, note, description);
        } else {
            detachedFile = jcrFacade.createFile(gameModel, WorkspaceType.FILES, name, path, details.getMediaType().toString(),
                note, description, file, override);
        }
        /*} catch (final WegasRuntimeException ex) {
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
         */
        return Response.ok(detachedFile, MediaType.APPLICATION_JSON).build();
    }

    /**
     * @param gameModelId
     * @param name
     * @param request
     * @param range       partial content range
     *
     * @return the requested file with http 20x, 4xx if something went wrong
     */
    @GET
    @Path("read{absolutePath : .*?}")
    //@CacheAge(time = 48, unit = TimeUnit.HOURS)
    public Response read(@PathParam("gameModelId") Long gameModelId,
        @PathParam("absolutePath") String name,
        @Context Request request,
        @HeaderParam("Range") String range) {

        logger.debug("Asking file (/{})", name);
        AbstractContentDescriptor fileDescriptor;

        GameModel gameModel = gameModelFacade.find(gameModelId);
        jcrFacade.assertPathReadRight(gameModel, name);
        // ContentConnector connector = null;
        Response.ResponseBuilder response = Response.status(404);
        try {
            final ContentConnector connector = this.getContentConnector(gameModelId);

            fileDescriptor = DescriptorFactory.getDescriptor(name, connector);

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
                     * Chunk media if the range upper bound is unspecified. Chrome sends "bytes=0-"
                     */
                    long to;
                    if (ranges.length == 2) {
                        to = Long.parseLong(ranges[1]);
                    } else {
                        //to = from + CHUNK_SIZE; // chunk_size was 2MB
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

                    // set a default cacheControl prevent out CacheResponseFilter to set "no-cache, no-store"
                    response.cacheControl(new CacheControl()).lastModified(fileD.getDataLastModified().getTime());
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

        try {
            final ContentConnector connector = this.getContentConnector(gameModelId);
            return DescriptorFactory.getDescriptor(name, connector);
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
     *
     * @return list of directory content
     */
    @GET
    @Path("list{absoluteDirectoryPath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<AbstractContentDescriptor> listDirectory(@PathParam("gameModelId") Long gameModelId, @PathParam("absoluteDirectoryPath") String directory) {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        return jcrFacade.listDirectory(gameModel, ContentConnector.WorkspaceType.FILES, directory);
    }

    /**
     * @param gameModelId
     * @param directory
     *
     * @return list of directory content and its subdirectories recursively
     */
    @GET
    @Path("recurseList{absoluteDirectoryPath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<AbstractContentDescriptor> recurseListDirectory(@PathParam("gameModelId") Long gameModelId, @PathParam("absoluteDirectoryPath") String directory) {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        return jcrFacade.recurseListDirectory(gameModel, ContentConnector.WorkspaceType.FILES, directory);
    }

    /**
     * @param gameModelId
     *
     * @return xml repository export
     *
     * @throws RepositoryException
     * @throws IOException
     */
    @GET
    @Path("exportRawXML")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response exportXML(@PathParam("gameModelId") Long gameModelId) throws RepositoryException, IOException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    final ContentConnector connector = getContentConnector(gameModelId);
                    try {
                        connector.exportXML(output);
                    } finally {
                        if (!connector.getManaged()) {
                            connector.rollback();
                        }
                    }
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
     *
     * @return gzipped XML repository export
     *
     * @throws RepositoryException
     */
    @GET
    @Path("exportXML")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response exportGZ(@PathParam("gameModelId") Long gameModelId) throws RepositoryException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    try (ByteArrayOutputStream xmlStream = new ByteArrayOutputStream()) {
                        final ContentConnector connector = getContentConnector(gameModelId);
                        try {
                            connector.exportXML(xmlStream);
                            try (GZIPOutputStream o = new GZIPOutputStream(output)) {
                                o.write(xmlStream.toByteArray());
                            }
                        } finally {
                            if (!connector.getManaged()) {
                                connector.rollback();
                            }
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
     *
     * @return ZIP repository export
     *
     * @throws RepositoryException
     */
    @GET
    @Path("exportZIP")
    public Response exportZIP(@PathParam("gameModelId") Long gameModelId) throws RepositoryException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try (ZipOutputStream zipOutputStream = new ZipOutputStream(output)) {
                    final ContentConnector connector = getContentConnector(gameModelId);
                    try {
                        connector.zipDirectory(zipOutputStream, "/");
                    } finally {
                        if (!connector.getManaged()) {
                            connector.rollback();
                        }
                    }
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
     *
     * @return imported repository elements
     *
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

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        try {
            final ContentConnector connector = this.getContentConnector(gameModelId);
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
        } finally {
            file.close();
        }
        return this.listDirectory(gameModelId, "/");
    }

    /**
     * @param gameModelId
     * @param absolutePath
     * @param force
     *
     * @return the destroyed element or HTTP not modified
     *
     * @throws WegasErrorMessage when deleting a non empty directory without force=true
     */
    @DELETE
    @Path("{force: (force/)?}delete{absolutePath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object delete(@PathParam("gameModelId") Long gameModelId,
        @PathParam("absolutePath") String absolutePath,
        @PathParam("force") String force) {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        jcrFacade.assertPathWriteRight(gameModel, absolutePath);

        return jcrFacade.delete(gameModel, ContentConnector.WorkspaceType.FILES, absolutePath, force);
    }

    @POST
    @Path("{force: (force/)?}post_delete")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Object deleteByPOST(@PathParam("gameModelId") Long gameModelId,
        @PathParam("force") String force,
        String absolutePath) {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        return jcrFacade.delete(gameModel, ContentConnector.WorkspaceType.FILES, absolutePath, force);
    }

    /**
     * Update File Meta
     *
     * @param tmpDescriptor
     * @param gameModelId
     * @param absolutePath
     *
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

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        try {
            final ContentConnector connector = this.getContentConnector(gameModelId);

            descriptor = DescriptorFactory.getDescriptor(absolutePath, connector);
            descriptor.setNote(tmpDescriptor.getNote());
            descriptor.setDescription(tmpDescriptor.getDescription());
            if (gameModel.isModel()) {
                descriptor.setVisibility(tmpDescriptor.getVisibility());
            }
            descriptor.saveContentToRepository();
            descriptor.loadContentFromRepository();                              //Update
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

        requestManager.checkPermission("GameModel:Delete:gm" + gameModelId);

        try {
            final ContentConnector fileManager = this.getContentConnector(gameModelId);
            fileManager.deleteRoot();
        } catch (RepositoryException ex) {
            logger.error(null, ex);
        }
    }
}
