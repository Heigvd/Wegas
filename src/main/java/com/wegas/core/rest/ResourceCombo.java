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

import java.io.IOException;
import java.io.InputStream;
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
     * @return
     */
    @GET
    @Produces({"text/javascript", "text/css"})
    public Response index(@Context Request req) throws IOException {
        final Set<String> files = this.uriInfo.getQueryParameters().keySet();

        final String mediaType = ( files.iterator().next().endsWith("css") ) // Select the content-type based on the first file extension
                ? "text/css"
                : "text/javascript";

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
        StringBuilder combinedJavaScript = new StringBuilder();
        for (String fileName : fileList) {
            try {
                InputStream fis = (InputStream) servletContext.getResource(fileName).getContent();
                String content = new Scanner(fis).useDelimiter("\\A").next();   // Use a fake delimiter to read all lines at once

                if (mediaType.equals("text/css")) {                             // @hack for css files, we correct the path
                    String dir = fileName.substring(0, fileName.lastIndexOf('/') + 1);
                    content = content.replace("url(",
                            "url(" + servletContext.getContextPath() + dir);
                }

                combinedJavaScript.append(content);
            }
            catch (NullPointerException e) {
                logger.error("Resource not found : {}", fileName);
            }
            catch (IOException e) {
                logger.error("Error reading file: {}", fileName);
            }
        }
        return combinedJavaScript.toString();
    }
}
