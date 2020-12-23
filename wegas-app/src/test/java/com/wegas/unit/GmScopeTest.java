/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit;

import com.wegas.utils.AbstractTest;
import java.io.IOException;
import org.junit.jupiter.api.Test;

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
