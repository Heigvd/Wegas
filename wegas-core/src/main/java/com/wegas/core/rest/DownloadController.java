/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.Charset;
import jakarta.ejb.Stateless;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import org.glassfish.jersey.media.multipart.FormDataParam;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("Download")
public class DownloadController {

    /**
     *
     * @param contentType
     * @param filename
     * @param data
     * @return requested data
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Path("{filename}")
    public Response forward(@FormDataParam("ctype") String contentType, @PathParam("filename") String filename, @FormDataParam("data") final String data) {
        return Response.ok(new StreamingOutput() {
            @Override
            public void write(OutputStream out) throws IOException, WebApplicationException {
                out.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF}); //UTF8 BOM
                out.write(data.getBytes(Charset.forName("UTF-8")));
            }
        }, contentType).header("Content-Disposition", "attachment; filename=" + filename).build();
    }
}
