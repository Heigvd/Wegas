/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.Helper;
import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import javax.ejb.Stateless;
import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.*;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * This servlet allows to retrieve several resources in a single request. Used
 * to combine .js and .css files.
 *
 * Resulting files should be cached. For example check
 * https://github.com/smaring/javascript-combo-service/blob/master/src/main/java/org/maring/util/js/JavascriptComboService.java
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("combo")
public class ComboController {

    final static private String MediaTypeCss = "text/css; charset=ISO-8859-1";
    final static private String MediaTypeJs = "text/javascript; charset=ISO-8859-1";
    private static final Logger logger = LoggerFactory.getLogger(ComboController.class);
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

        final CacheControl cc = new CacheControl();
        cc.setMaxAge(60000);
        //cc.setPrivate(true);
        //cc.setNoTransform(true);
        //cc.setMustRevalidate(false);
        //cc.setNoCache(false);

        //EntityTag etag = new EntityTag();
        //Response.ResponseBuilder responseBuilder = request.evaluatePreconditions(updateTimestamp, etag);


        return Response.ok(this.getCombinedFile(files, mediaType)).
                type(mediaType).
                cacheControl(cc).
                //expires()
                build();

    }

    private String getCombinedFile(Set<String> fileList, String mediaType) throws IOException {
        StringBuilder acc = new StringBuilder();
        for (String fileName : fileList) {
            try {
                InputStream fis = (InputStream) servletContext.getResourceAsStream(fileName);
                String content = IOUtils.toString(fis, Helper.getWegasProperty("encoding"));
                //String content = new Scanner(fis, Helper.getWegasProperty("encoding")).useDelimiter("\\A").next();   // Use a fake delimiter to read all lines at once
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
