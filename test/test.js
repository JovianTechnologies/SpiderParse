/**
 * Created by Eric on 4/23/2015.
 */
$(document).ready(function(){

    $.get("trello.html", function(data){
        var start = +new Date();
        var doc = SpiderParse.parse(data);
        var end = +new Date();
        console.log(end - start);
        start = +new Date();
        var doc2 = jQuery.parseHTML(data);
        end = +new Date();
        console.log(end - start);
        var parser = new DOMParser();
        start = +new Date();
        var doc3 = parser.parseFromString(data,"text/html");
        end = +new Date();
        console.log(end - start);
        var test = doc;
    });
});

