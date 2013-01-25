/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import java.io.IOException;
import java.io.InputStream;
import java.util.ResourceBundle;
import java.util.Scanner;
import java.util.Set;
import javax.ejb.Stateless;
import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * This servlet allows to retrieve several resources in a single request. Used
 * to combine .js and .css files.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("combo")
public class ResourceCombo {

    final static private String MediaTypeCss = "text/css; charset=ISO-8859-1";
    final static private String MediaTypeJs = "text/javascript; charset=ISO-8859-1";
    private static final Logger logger = LoggerFactory.getLogger(ResourceCombo.class);
    /**
     *
     */
    @Context
    protected UriInfo uriInfo;
    /**
     *
     */
    @Context
    private ServletContext servletContext;

    /**
     * Retrieve
     *
     * @param req
     * @return
     * @throws IOException
     */
    @GET
    @Produces({MediaTypeJs, MediaTypeCss})
    public Response index(@Context Request req) throws IOException {
        final Set<String> files = this.uriInfo.getQueryParameters().keySet();
        final String mediaType = (files.iterator().next().endsWith("css")) // Select the content-type based on the first file extension
                ? MediaTypeCss : MediaTypeJs;

        // MediaType types[] = {"application/json", "application/xml"};
        // List<Variant> vars = Variant.mediaTypes(types).add().build();
        // Variant var = req.selectVariant(vars);

        //final CacheControl cacheControl = new CacheControl();
        //cacheControl.setMaxAge(60000);

        return Response.ok(this.getCombinedFile(files, mediaType)).
                type(mediaType).
                //cacheControl(cacheControl).
                //expires()
                build();

    }

    private String getCombinedFile(Set<String> fileList, String mediaType) throws IOException {
        StringBuilder acc = new StringBuilder();
        for (String fileName : fileList) {
            try {
                InputStream fis = (InputStream) servletContext.getResourceAsStream(fileName);
                String content = IOUtils.toString(fis, ResourceBundle.getBundle("wegas").getString("encoding"));
                //String content = new Scanner(fis, ResourceBundle.getBundle("wegas").getString("encoding")).useDelimiter("\\A").next();   // Use a fake delimiter to read all lines at once
                if (mediaType.equals(MediaTypeCss)) {                             // @hack for css files, we correct the path
                    String dir = fileName.substring(0, fileName.lastIndexOf('/') + 1);
                    content = content.replaceAll("url\\(([^:\\)]+\\))",
                            "url(" + servletContext.getContextPath() + dir + "$1"); //Regexp to avoid rewriting protocol guess they contain ':' (http: data:)
                }

                acc.append(content);
            } catch (NullPointerException e) {
                logger.error("Resource not found : {}", fileName);
            }
        }
        return acc.toString();
    }
}
