/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.facebook;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Simple class for holding data relating to a facebook user
 *
* @author Mike
 *
*/
public class FacebookUserDetails {

    private String id;
    private String firstName;
    private String lastName;
    private String email;
// jsonString Expected to be something like this
// {
// "education": [{
// "school": {
// "id": "123456789012345",
// "name": "University of Sheffield"
// },
// "type": "Graduate School",
// "with": [{
// "id": "123456789",
// "name": "Daffy Duck"
// }]
// }],
// "first_name": "Mike",
// "id": "121212121",
// "last_name": "Warren",
// "link":
// "http://www.facebook.com/profile.php?id=121212121",
// "locale": "en_US",
// "name": "Mike Warren",
// "updated_time": "2011-08-15T14:51:05+0000",
// "verified": true
// }
    private String jsonString;

    /**
     *
     * @param fbResponse
     */
    public FacebookUserDetails(String fbResponse) {
        jsonString = fbResponse;
        JSONObject respjson;
        try {
            respjson = new JSONObject(fbResponse);
            this.id = respjson.getString("id");
            this.firstName = respjson.has("first_name") ? respjson.getString("first_name") : " no name" + id;
            this.lastName = respjson.has("last_name") ? respjson.getString("last_name") : "";
            this.email = respjson.has("email") ? respjson.getString("email") : "-no email-";
        }
        catch (JSONException e) {
            System.out.println("fbResponse:" + fbResponse);
            e.printStackTrace();
            throw new RuntimeException(e);
        }

    }

    public String toString() {
        return jsonString;
    }

    /**
     *
     * @return
     */
    public String getId() {
        return id;
    }

    /**
     *
     * @param id
     */
    public void setId(String id) {
        this.id = id;
    }

    /**
     *
     * @return
     */
    public String getFirstName() {
        return firstName;
    }

    /**
     *
     * @param firstName
     */
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    /**
     *
     * @return
     */
    public String getLastName() {
        return lastName;
    }

    /**
     *
     * @param lastName
     */
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    /**
     *
     * @return
     */
    public String getEmail() {
        return email;
    }

    /**
     *
     * @param email
     */
    public void setEmail(String email) {
        this.email = email;
    }
}
