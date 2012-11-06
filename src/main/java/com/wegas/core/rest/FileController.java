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
package com.wegas.core.rest;

import com.sun.jersey.multipart.FormDataBodyPart;
import com.sun.jersey.multipart.FormDataParam;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnectorFactory;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.content.FileDescriptor;
import com.wegas.exception.WegasException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.jcr.ItemExistsException;
import javax.jcr.LoginException;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.ws.rs.*;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import org.slf4j.LoggerFactory;
import org.xml.sax.SAXException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("File{gameModelId : (/GameModelId/[1-9][0-9]*)?}")
public class FileController {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(FileController.class);
    @EJB
    private GameModelFacade gmFacade;
    private final String FILENAME_REGEXP = "(\\w|\\.| |-|_)+";

    /**
     *
     * @param gameModelId
     * @param name
     * @param note
     * @param path
     * @param file
     * @param details
     * @return
     * @throws RepositoryException
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("upload{directory : .*?}")
    public AbstractContentDescriptor upload(@PathParam("gameModelId") String gameModelId,
            @FormDataParam("name") String name,
            @FormDataParam("note") String note,
            @FormDataParam("note") String description,
            @PathParam("directory") String path,
            @FormDataParam("file") InputStream file,
            @FormDataParam("file") FormDataBodyPart details) throws RepositoryException, WegasException {
        logger.debug("File name: {}", details.getContentDisposition().getFileName());
        if (name == null) {
            name = details.getContentDisposition().getFileName();
        }
        Pattern pattern = Pattern.compile(FILENAME_REGEXP);
        Matcher matcher = pattern.matcher(name);
        if (name.equals("") || !matcher.matches()) {
            throw new WegasException(name + " is not a valid filename.");
        }
        ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));

        AbstractContentDescriptor detachedFile = null;
        AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
        if (dir.exist()) {                                                  //directory has to exist
            if (details == null || details.getContentDisposition().getFileName() == null || details.getContentDisposition().getFileName().equals("")) {       //Assuming an empty filename means a directory
                detachedFile = new DirectoryDescriptor(name, path, connector);
            } else {
                logger.debug("File name: {}", details.getContentDisposition().getFileName());
                detachedFile = new FileDescriptor(name, path, connector);
            }
            if (!detachedFile.exist()) {                                        //Node should not exist
                note = note == null ? "" : note;
                detachedFile.setNote(note);
                detachedFile.setDescription(description);
                if (detachedFile instanceof FileDescriptor) {
                    //TODO : check allowed mime-types
                    try {
                        ((FileDescriptor) detachedFile).setBase64Data(file, details.getMediaType().toString());
                        logger.info(details.getFormDataContentDisposition().getFileName() + "(" + details.getMediaType() + ") uploaded as \"" + name + "\"");
                    } catch (IOException ex) {
                        logger.error("Error reading uploaded file :", ex);
                        connector.save();
                    }
                } else {
                    detachedFile.sync();
                    logger.info("Directory {} created at {}", detachedFile.getName(), detachedFile.getPath());
                }
            } else {
                throw new WegasException(detachedFile.getPath() + "/" + name + " already exists");
            }
        } else {
            logger.debug("Parent Directory does not exist");
        }
        connector.save();
        return detachedFile;
    }

    /**
     *
     * @param gameModelId
     * @param name
     * @return
     */
    @GET
    @Path("read{absolutePath : .*?}")
    public Response read(@PathParam("gameModelId") String gameModelId, @PathParam("absolutePath") String name) {
        logger.debug("Asking file (/{})", name);
        AbstractContentDescriptor fileDescriptor;
        ContentConnector connector = null;
        Response.ResponseBuilder response = Response.status(404);
        try {
            connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
            fileDescriptor = DescriptorFactory.getDescriptor(name, connector);
        } catch (PathNotFoundException e) {
            logger.debug("Asked path does not exist: {}", e.getMessage());
            connector.save();
            return response.build();
        } catch (RepositoryException e) {
            logger.error("Need to check those errors", e);
            return response.build();
        }
        if (fileDescriptor instanceof FileDescriptor) {
            response = Response.ok(((FileDescriptor) fileDescriptor).getBase64Data());
            response.header("Content-Type", fileDescriptor.getMimeType());
            response.header("Description", fileDescriptor.getDescription());
            CacheControl cc = new CacheControl();
            cc.setMaxAge(3600);
            cc.setPrivate(true);
            response.cacheControl(cc);
            response.lastModified(((FileDescriptor) fileDescriptor).getDataLastModified().getTime());

            try {
                ((FileDescriptor) fileDescriptor).getBase64Data().close();
            } catch (IOException ex) {
                Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
            } finally {
                connector.save();
            }
        }
        return response.build();
    }

    /**
     *
     * @param gameModelId
     * @param directory
     * @return
     */
    @GET
    @Path("list{absoluteDirectoryPath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<AbstractContentDescriptor> listDirectory(@PathParam("gameModelId") String gameModelId, @PathParam("absoluteDirectoryPath") String directory) {
        logger.debug("Asking listing for directory (/{})", directory);
        try {
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
            AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(directory, connector);
            if (!dir.exist() || dir instanceof FileDescriptor) {
                connector.save();
                return null;
            } else if (dir instanceof DirectoryDescriptor) {
                List<AbstractContentDescriptor> ret = ((DirectoryDescriptor) dir).list();
                connector.save();
                return ret;
            }
        } catch (LoginException ex) {
            Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
        } catch (RepositoryException ex) {
            Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new ArrayList<>();
    }

    @GET
    @Path("exportRawXML")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response exportXML(@PathParam("gameModelId") String gameModelId) throws RepositoryException, IOException {
        final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    try {
                        connector.exportXML(output);
                    } catch (SAXException ex) {
                        Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
                    }
                } catch (RepositoryException ex) {
                    Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        };
        return Response.ok(out, MediaType.APPLICATION_OCTET_STREAM).header("content-disposition", "attachment; filename=WEGAS_" + gmFacade.find(new Long(extractGameModelId(gameModelId))).getName() + "_files.xml").build();
    }

    @GET
    @Path("exportXML")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response exportGZ(@PathParam("gameModelId") String gameModelId) throws RepositoryException {
        final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
        StreamingOutput out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    try {
                        try (ByteArrayOutputStream xmlStream = new ByteArrayOutputStream()) {
                            connector.exportXML(xmlStream);
                            try (GZIPOutputStream o = new GZIPOutputStream(output)) {
                                o.write(xmlStream.toByteArray());
                            }
                        }
                    } catch (SAXException ex) {
                        Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
                    }
                } catch (RepositoryException ex) {
                    Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        };
        return Response.ok(out, MediaType.APPLICATION_OCTET_STREAM).header("content-disposition", "attachment; filename=WEGAS_" + gmFacade.find(new Long(extractGameModelId(gameModelId))).getName() + "_files.xml.gz").build();
    }

    @POST
    @Path("importXML")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public List<AbstractContentDescriptor> importXML(@PathParam("gameModelId") String gameModelId,
            @FormDataParam("file") InputStream file,
            @FormDataParam("file") FormDataBodyPart details)
            throws RepositoryException, IOException, SAXException,
            ParserConfigurationException, TransformerException, WegasException {
        try {
            final ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
            switch (details.getMediaType().getSubtype()) {
                case "x-gzip":
                    try (GZIPInputStream in = new GZIPInputStream(file)) {
                        connector.importXML(in);
                    }
                    break;
                case "xml":
                    connector.importXML(file);
                    break;
                default:
                    throw new WegasException("Uploaded file mimetype does not match requirements [XML or Gunzip], found:" + details.getMediaType().toString());
            }
            connector.save();
        } finally {
            file.close();
        }
        return this.listDirectory(gameModelId, "/");
    }

    /**
     *
     * @param gameModelId
     * @param absolutePath
     * @param force
     * @return
     */
    @DELETE
    @Path("{force: (force/)?}delete{absolutePath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object delete(@PathParam("gameModelId") String gameModelId,
            @PathParam("absolutePath") String absolutePath,
            @PathParam("force") String force) {

        boolean recursive = force.equals("") ? false : true;
        logger.debug("Asking delete for node ({}), force {}", absolutePath, recursive);
        try {
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(absolutePath, connector);
            if (descriptor.exist()) {
                descriptor.sync();
                if (descriptor instanceof DirectoryDescriptor && ((DirectoryDescriptor) descriptor).isRootDirectory()) {
                    return Response.notModified("Unable to erase Root Directory").build();
                }
                try {
                    descriptor.delete(recursive);
                } catch (ItemExistsException e) {
                    return Response.notModified(e.getMessage()).build();
                }
                connector.save();
                return descriptor;
            } else {
                connector.save();
                return Response.notModified("Path" + absolutePath + " does not exist").build();
            }
        } catch (RepositoryException ex) {
            logger.error("Really what append here ??", ex);
        }
        return null;
    }

    @PUT
    @Path("{absolutePath : .*?}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractContentDescriptor update(AbstractContentDescriptor tmpDescriptor,
            @PathParam("gameModelId") String gameModelId,
            @PathParam("absolutePath") String absolutePath) {
        ContentConnector connector = null;
        AbstractContentDescriptor descriptor = null;
        try {
            connector = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
            descriptor = DescriptorFactory.getDescriptor(absolutePath, connector);
            descriptor.setNote(tmpDescriptor.getNote());
            descriptor.setDescription(tmpDescriptor.getDescription());
            descriptor.setContentToRepository();
        } catch (RepositoryException ex) {
            logger.debug("File does not exist", ex);
        } finally {
            connector.save();
        }
        return descriptor;
    }

    /**
     * Well... underlying function not yet implemented do it by hand for now
     *
     * @param gameModelId
     */
    @DELETE
    @Path("destruct")
    public void deleteWorkspace(@PathParam("gameModelId") String gameModelId) {
        try {
            ContentConnector fileManager = ContentConnectorFactory.getContentConnectorFromGameModel(extractGameModelId(gameModelId));
            fileManager.deleteWorkspace();
            fileManager.save();
        } catch (LoginException ex) {
            Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
        } catch (RepositoryException ex) {
            Logger.getLogger(FileController.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    /**
     * Converts a path gameModelId representation to a Long gameModelId
     *
     * @param pathGMId a string representing the game model id "/.../{id}"
     * @return Long - the game model id extracted from the input string
     */
    private static Long extractGameModelId(String pathGMId) {
        return pathGMId.equals("") ? null : new Long(pathGMId.split("/")[2]);
    }
}
