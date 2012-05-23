<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
    "http://www.w3.org/TR/html4/loose.dtd">

<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>JSP Page</title>
    </head>
    <body>
        <h1>Wegas</h1>
        <h1>File Upload</h1>

        name: <form action="rest/File/upload" method="post" enctype="multipart/form-data">
            <input type="text" name="name" />
            <p>
                Select a file : <input type="file" name="file" size="45" />
            </p>

            <input type="submit" value="Upload" />
        </form>

    </body>
</html>
