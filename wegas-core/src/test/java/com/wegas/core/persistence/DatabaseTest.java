/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.test.TestHelper;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class DatabaseTest extends AbstractArquillianTestMinimal {

    @Test
    public void testIndexes() {
        Assert.assertEquals("Some indexes are missing. Please create them with JPA and LiquiBase See log for details", 0, TestHelper.getMissingIndexesCount());
    }
}
