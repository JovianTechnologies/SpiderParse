/**
 * Created by Eric on 4/23/2015.
 */
$(document).ready(function(){
    $.get('index.html', function(data){
        var doc = SpiderParse.parse(data);
        //var doc2 = jQuery.parseHTML(data);
        //var parser = new DOMParser();
        //var doc3 = parser.parseFromString(data,"text/html");
        var test = doc;
    });
});

