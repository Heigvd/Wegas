<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html class="no-js" ng-app="Wegas">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Wegas - Web game authoring system</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width">
        <!-- Place favicon.ico and apple-touch-icon.png in the root directory -->

        <link rel="stylesheet" href="assets/css/app-min.css">
        <!-- IE11 detection: -->
        <style>
            .browsehappy { display: none; }
            .browsehappy a { font-weight: bold; text-decoration: underline; }
            _:-ms-fullscreen, :root .browsehappy { display:block; }
        </style>
    </head>
    <body>
        <!--[if lte IE 10]>
            <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
        <![endif]-->
        <p class="browsehappy" id="browsehappy" style="text-align: center; font-size: 130%; font-weight: bold;">Your browser (Internet Explorer) is unfortunately not supported. Please <a href="http://browsehappy.com/">switch to another browser</a>.</p>

        <flash:messages></flash:messages>
        <div ui-view="main" class="view view--main view--background-default"></div>

        <script>
            (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=
            function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;
            e=o.createElement(i);r=o.getElementsByTagName(i)[0];
            e.src='//www.google-analytics.com/analytics.js';
            r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));
            ga('create','UA-16543988-2');ga('send','pageview');
        </script>
        <script src="assets/js/vendor-min.js"></script>

        <script src="assets/js/app-min.js"></script>

        <script type="application/javascript">
            if (navigator.appName == 'Microsoft Internet Explorer' || !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1)){
                alert("Your browser (Internet Explorer) is unfortunately not supported. Please switch to another browser.");
            } else {
                var node = document.getElementById("browsehappy"), ptnode;
                if (node && (ptnode = node.parentNode)) {
                    ptnode.removeChild(node);
                }
            }
        </script>
    </body>
</html>
