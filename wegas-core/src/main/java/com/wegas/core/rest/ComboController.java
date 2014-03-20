/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.Helper;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import javax.ejb.Stateless;
import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.*;
import javax.ws.rs.core.Response.ResponseBuilder;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * This servlet allows to retrieve several resources in a single request. Used
 * to combine .js and .css files.
 *
 * @todo Resulting files should be cached. For example check
 * https://github.com/smaring/javascript-combo-service/blob/master/src/main/java/org/maring/util/js/JavascriptComboService.java
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("combo")
public class ComboController {

    private static final Logger logger = LoggerFactory.getLogger(ComboController.class);
    /**
     *
     */
    final static public String MediaTypeCss = "text/css; charset=ISO-8859-1";
    final static public String MediaTypeJs = "text/javascript; charset=ISO-8859-1";
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
        final CacheControl cc = new CacheControl();
        cc.setMaxAge(60 * 60 * 3);
        cc.setNoTransform(false);
        //cc.setPrivate(true);
        //cc.setMustRevalidate(false);
        //cc.setNoCache(false);
        //final Set<String> files = this.uriInfo.getQueryParameters().keySet(); // Old version, removed cause query parameters where in the wrong order
        ArrayList<String> files = new ArrayList<>();                            // New version, with parameters in the right order
        for (String parameter : this.uriInfo.getRequestUri().getQuery().split("&")) {
            String split = parameter.split("=")[0];
            if (split != null) {
                files.add(split);
            }
        }
        EntityTag etag = new EntityTag(files.hashCode() + "");
        ResponseBuilder rb = req.evaluatePreconditions(etag);
        if (rb != null && (files.contains("v") || files.contains("version"))) { //if no version string, version change are not tracked
            return rb.cacheControl(cc).tag(etag).build();
        }
        files.remove("v");
        files.remove("version");

        final String mediaType = (files.iterator().next().endsWith("css"))
                ? MediaTypeCss : MediaTypeJs;                            // Select the content-type based on the first file extension

        // MediaType types[] = {"application/json", "application/xml"};
        // List<Variant> vars = Variant.mediaTypes(types).add().build();
        // Variant var = req.selectVariant(vars);
        //EntityTag etag = new EntityTag();
        //Response.ResponseBuilder responseBuilder = request.evaluatePreconditions(updateTimestamp, etag);
        return Response.ok(this.getCombinedFile(files, mediaType))
                .type(mediaType)
                .cacheControl(cc)
                .expires(new Date(System.currentTimeMillis() + (1000 * 60 * 60 * 24 * 3)))
                .tag(etag)
                .build();
    }

    private String getCombinedFile(List<String> fileList, String mediaType) throws IOException {
        StringBuilder acc = new StringBuilder();
        for (String fileName : fileList) {
            try {
                InputStream fis = (InputStream) servletContext.getResourceAsStream(fileName);
                String content = IOUtils.toString(fis, Helper.getWegasProperty("encoding"));
                //String content = new Scanner(fis, Helper.getWegasProperty("encoding"))
                //.useDelimiter("\\A").next();                              // Use a fake delimiter to read all lines at once

                if (mediaType.equals(MediaTypeCss)) {                       // @hack for css files, we correct the path
                    String dir = fileName.substring(0, fileName.lastIndexOf('/') + 1);
                    content = content.replaceAll("url\\(\"?\'?([^:\\)\"\']+)\"?\'?\\)",
                            "url(" + servletContext.getContextPath()
                            + dir + "$1)");              //Regexp to avoid rewriting protocol guess they contain ':' (http: data:)
                }
                acc.append(content);
            } catch (NullPointerException e) {
                logger.error("Resource not found : {}", fileName);
            }
        }
        return acc.toString();
    }
}
