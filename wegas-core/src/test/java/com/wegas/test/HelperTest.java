/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.test;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import java.util.List;
import org.junit.*;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class HelperTest {


    @Test
    public void testStripLabelSuffix() {
        System.out.println("stripLabelSuffix");
        assertEquals("test1String", Helper.stripLabelSuffix("test1String(32)"));
        assertEquals("test(1String)", Helper.stripLabelSuffix("test(1String)(32)"));
        assertEquals("test(1String32)", Helper.stripLabelSuffix("test(1String32)"));
        assertEquals("test1String(3s2)", Helper.stripLabelSuffix("test1String(3s2)"));
    }

    @Test
    public void testGetLabelSuffix() {
        System.out.println("getLabelSuffix");
        assertEquals(32, Helper.getLabelSuffix("test1String(32)"));
        assertEquals(32, Helper.getLabelSuffix("test(1String)(32)"));
        assertEquals(0, Helper.getLabelSuffix("test(1String32)"));
    }

    @Test
    public void testEncodeVariableName() {
        System.out.println("encodeVariableName");
        assertEquals("testEncode", Helper.encodeVariableName("test encode"));
        assertEquals("a4", Helper.encodeVariableName("a 4"));
        assertEquals("_5Test1", Helper.encodeVariableName("5 test 1"));
        try {
            Helper.encodeVariableName(null);
        } catch (Throwable t) {
            assertEquals(NullPointerException.class, t.getClass());
        }
        try {
            Helper.encodeVariableName("");
        } catch (Throwable t) {
            assertEquals(WegasErrorMessage.class, t.getClass());
        }
    }

    @Test
    public void testHumanize(){
        assertEquals("some files", Helper.humanize("SomeFiles"));
        assertEquals("PDF file", Helper.humanize("PDFFile"));
        assertEquals("99 files", Helper.humanize("99Files"));
        assertEquals("file 123", Helper.humanize("File123"));
        assertEquals("some pDF files", Helper.humanize("SomePDFFiles"));
    }

    @Test
    public void testPSQLExceptionParse(){
        ServerErrorMessage serverErrorMessage = new ServerErrorMessage("SERROR VERROR C23505 Mduplicate key value violates unique constraint \"index_accountdetails_email\" DKey (email)=(maxence.laurent+p2@gmail.com) already exists. spublic taccountdetails nindex_accountdetails_email Fnbtinsert.c L534 R_bt_check_unique  ");
        PSQLException ex = new PSQLException(serverErrorMessage);

        String pp = Helper.prettyPrintPSQLException(ex);

        System.out.println(pp);
    }

    @Test
    public void testSanitizePath(){
        assertEquals(Helper.cleanFilename("hello"), "hello");
        assertEquals(Helper.cleanFilename("/hello"), "hello");
        assertEquals(Helper.cleanFilename("hello/"), "hello");
        assertEquals(Helper.cleanFilename("/hello/"), "hello");

        assertEquals(Helper.cleanFilename("hello/world"), "hello/world");
        assertEquals(Helper.cleanFilename("/hello/world"), "hello/world");
        assertEquals(Helper.cleanFilename("hello/world/"), "hello/world");
        assertEquals(Helper.cleanFilename("/hello/world/"), "hello/world");

        assertEquals(Helper.cleanFilename("hello/sad/and/beautiful/world"), "hello/sad/and/beautiful/world");
        assertEquals(Helper.cleanFilename("/hello/sad/and/beautiful/world"), "hello/sad/and/beautiful/world");
        assertEquals(Helper.cleanFilename("hello/sad/and/beautiful/world/"), "hello/sad/and/beautiful/world");
        assertEquals(Helper.cleanFilename("/hello/sad/and/beautiful/world/"), "hello/sad/and/beautiful/world");

        assertEquals(Helper.cleanFilename("hello//sad/and//beautiful/world"), "hello/sad/and/beautiful/world");
        assertEquals(Helper.cleanFilename("//hello/sad/and/beautiful/world"), "hello/sad/and/beautiful/world");
        assertEquals(Helper.cleanFilename("hello/sad/and//beautiful/world//"), "hello/sad/and/beautiful/world");
        assertEquals(Helper.cleanFilename("//hello//sad//and//beautiful//world//"), "hello/sad/and/beautiful/world");
    }

    private void testAllPathsInternal(String path, String ...expected){
        List<String> allPaths = Helper.getAllPaths(path);
        assertEquals(allPaths.size(), expected.length);

        for (int i = 0; i < expected.length; i++) {
            assertEquals(expected[i], allPaths.get(i));
        }
    }

    @Test
    public void testAllPaths() {
        testAllPathsInternal("hello", "hello");
        testAllPathsInternal("hello/world", "hello", "hello/world");
        testAllPathsInternal("hello/sad/world", "hello", "hello/sad", "hello/sad/world");
        testAllPathsInternal("/hello//sad//world", "hello", "hello/sad", "hello/sad/world");
    }

    @Test
    public void testLRUCache() {
        Helper.LRUCache<String, String> lruCache = new Helper.LRUCache<>(10);

        assertEquals(0, lruCache.size());

        lruCache.putIfAbsentAndGet("1", "1");

        assertEquals(1, lruCache.size());
        lruCache.putIfAbsentAndGet("2", "2");
        lruCache.putIfAbsentAndGet("3", "3");
        lruCache.putIfAbsentAndGet("4", "4");
        lruCache.putIfAbsentAndGet("5", "5");
        lruCache.putIfAbsentAndGet("6", "6");
        lruCache.putIfAbsentAndGet("7", "7");
        lruCache.putIfAbsentAndGet("8", "8");
        lruCache.putIfAbsentAndGet("9", "9");
        lruCache.putIfAbsentAndGet("10", "10");
        assertEquals("Reach Max Size", 10, lruCache.size());

        // put "11" will eject eldest
        assertTrue(lruCache.containsKey("1"));
        lruCache.putIfAbsentAndGet("11", "11");
        assertFalse(lruCache.containsKey("1"));

        //update "2"
        assertTrue(lruCache.containsKey("2"));
        lruCache.put("2", "2bis");
        // put "12" will remove eldest (ie "3")
        lruCache.putIfAbsentAndGet("12", "12");
        assertTrue(lruCache.containsKey("2"));
        assertFalse(lruCache.containsKey("3"));
        //

        lruCache.putIfAbsentAndGet("13", "13");
        lruCache.putIfAbsentAndGet("14", "14");
        lruCache.putIfAbsentAndGet("15", "15");
        lruCache.putIfAbsentAndGet("16", "16");
        lruCache.putIfAbsentAndGet("17", "17");
        lruCache.putIfAbsentAndGet("18", "18");
        lruCache.putIfAbsentAndGet("19", "19");
        lruCache.putIfAbsentAndGet("20", "20");

        assertEquals("Final size", 10, lruCache.size());
    }
}
