/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import java.io.OutputStream;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.sax.SAXSource;
import javax.xml.transform.stream.StreamResult;
import org.xml.sax.*;

/**
 * Serilalize SAX Events to outputStream
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Deprecated(forRemoval = true)
public class XMLSerializer implements ContentHandler {

    private ContentHandler ch;
    private Boolean started = false;

    /**
     *
     * @param os
     * @throws SAXException
     */
    public XMLSerializer(OutputStream os) throws SAXException {
        try {
            TransformerFactory tf = TransformerFactory.newInstance();
            final Transformer t = tf.newTransformer();
            t.transform(new SAXSource(new XMLReader() {
                @Override
                public ContentHandler getContentHandler() {
                    return ch;
                }

                @Override
                public DTDHandler getDTDHandler() {
                    return null;
                }

                @Override
                public EntityResolver getEntityResolver() {
                    return null;
                }

                @Override
                public ErrorHandler getErrorHandler() {
                    return null;
                }

                @Override
                public boolean getFeature(String name) {
                    return false;
                }

                @Override
                public Object getProperty(String name) {
                    return null;
                }

                @Override
                public void parse(InputSource input) {
                    // noop
                }

                @Override
                public void parse(String systemId) {
                    // noop
                }

                @Override
                public void setContentHandler(ContentHandler handler) {
                    ch = handler;
                }

                @Override
                public void setDTDHandler(DTDHandler handler) {
                    // noop
                }

                @Override
                public void setEntityResolver(EntityResolver resolver) {
                    // noop
                }

                @Override
                public void setErrorHandler(ErrorHandler handler) {
                    // noop
                }

                @Override
                public void setFeature(String name, boolean value) {
                    // noop
                }

                @Override
                public void setProperty(String name, Object value) {
                    // noop
                }
            }, new InputSource()), new StreamResult(os));
        } catch (TransformerException e) {
            throw new SAXException(e);
        }
    }

    @Override
    public void setDocumentLocator(Locator locator) {
        ch.setDocumentLocator(locator);
    }

    @Override
    public void startDocument() throws SAXException {
        if (!started) {
            //Document should only be started once.
            ch.startDocument();
            started = true;
        }
    }

    @Override
    public void endDocument() throws SAXException {
        ch.endDocument();
        started = false;
    }

    @Override
    public void startPrefixMapping(String prefix, String uri) throws SAXException {
        ch.startPrefixMapping(prefix, uri);
    }

    @Override
    public void endPrefixMapping(String prefix) throws SAXException {
        ch.endPrefixMapping(prefix);
    }

    @Override
    public void startElement(String uri, String localName, String qName, Attributes atts) throws SAXException {
        ch.startElement(uri, localName, qName, atts);
    }

    @Override
    public void endElement(String uri, String localName, String qName) throws SAXException {
        ch.endElement(uri, localName, qName);
    }

    @Override
    public void characters(char[] ch, int start, int length) throws SAXException {
        this.ch.characters(ch, start, length);
    }

    @Override
    public void ignorableWhitespace(char[] ch, int start, int length) throws SAXException {
        this.ch.ignorableWhitespace(ch, start, length);
    }

    @Override
    public void processingInstruction(String target, String data) throws SAXException {
        ch.processingInstruction(target, data);
    }

    @Override
    public void skippedEntity(String name) throws SAXException {
        ch.skippedEntity(name);
    }
}
