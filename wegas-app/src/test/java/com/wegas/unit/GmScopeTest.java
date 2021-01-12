/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit;

import com.wegas.utils.AbstractTest;
import java.io.IOException;
import org.junit.Test;

/**
 *
 * @author maxence
 */


public class GmScopeTest extends AbstractTest {

    @Test
    public void testScopes() throws IOException{
        this.createGameModelFromFile("src/test/resources/gmScope.json");
    }

}
