/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

/**
 * Servlet Response Wrapper used by PdfRenderer to intercept page content
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class ContentCaptureServletResponse extends HttpServletResponseWrapper {

    private ByteArrayOutputStream contentBuffer;
    private PrintWriter writer;

    public ContentCaptureServletResponse(HttpServletResponse response) {
        super(response);
    }

    @Override
    public PrintWriter getWriter() throws IOException {
        if (writer == null) {
            writer = new PrintWriter(getContentBuffer());
        }
        return writer;
    }

    private ByteArrayOutputStream getContentBuffer() {
        if (contentBuffer == null) {
            contentBuffer = new ByteArrayOutputStream();
        }
        return contentBuffer;
    }

    public String getContent() throws IOException {
        getWriter().flush();
        String xhtmlContent = new String(getContentBuffer().toString()); // Do not to double-encode UTF8 strings

        xhtmlContent = xhtmlContent.replaceAll("<thead>|</thead>|" + "<tbody>|</tbody>", "");
        xhtmlContent = xhtmlContent.replaceAll("<br>", "<br />");

        return xhtmlContent;
    }
}
