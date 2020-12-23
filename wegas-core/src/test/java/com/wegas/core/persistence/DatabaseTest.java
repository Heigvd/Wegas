/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.test.TestHelper;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 *
 * @author maxence
 */
public class DatabaseTest extends AbstractArquillianTestMinimal {

    @Test
    public void testIndexes() {
        Assertions.assertEquals(0, TestHelper.getMissingIndexesCount(), "Some indexes are missing. Please create them with JPA and LiquiBase See log for details");
    }
}
