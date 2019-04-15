/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.facebook;

/**
 * Simple class for holding data relating to a facebook user
 *
 * @author Mike
 *
 */
public class FacebookUserDetails {

    private String id;
    private String firstname;
    private String lastname;
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
        /*jsonString = fbResponse;
        JSONObject respjson;
        try {
            respjson = new JSONObject(fbResponse);
            this.id = respjson.getString("id");
            this.firstname = respjson.has("first_name") ? respjson.getString("first_name") : " no name" + id;
            this.lastname = respjson.has("last_name") ? respjson.getString("last_name") : "";
            this.email = respjson.has("email") ? respjson.getString("email") : "-no email-";
        } catch (JSONException e) {
            System.out.println("fbResponse:" + fbResponse);
            e.printStackTrace();
            throw new RuntimeException(e);
        }*/

    }

    public String toString() {
        return jsonString;
    }

    /**
     *
     * @return facebook user id
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
     * @return facebook user firsname
     */
    public String getFirstname() {
        return firstname;
    }

    /**
     *
     * @param firstname
     */
    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    /**
     *
     * @return facebook user lastname
     */
    public String getLastname() {
        return lastname;
    }

    /**
     *
     * @param lastname
     */
    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    /**
     *
     * @return facebook user email
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
