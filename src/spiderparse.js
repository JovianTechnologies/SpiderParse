(function(window){

    window.SpiderParse = {
        parse: function(htmlString){
            var self = this;
            var attrRegEx = /[^<.*\s]*\s*=\s*((['][^']*['])|(["][^"]*["])|([^'"]*\s))/g;
            var SpiderNode = function(){
                this.attributes = [];
                this.childNodes = [];
                this.innerHTML = "";
                this.name = "";
                this.nextSibling = null;
                this.outerHTML = "";
                this.parentNode = null
                this.previousSibling = null;
            };

            var parsedHTML = { childNodes: [] };

            (function getTags(htmlString, childList, parent, previousSibling){
                var startTagBeginLocation = htmlString.indexOf("<");
                if(startTagBeginLocation >= 0 ){
                    htmlString = htmlString.substring(startTagBeginLocation);

                    var child = new SpiderNode();

                    //get tag by either finding a space or the end of the tag
                    var startTagEndLocation = htmlString.search(/\/?>/);
                    var startTagEnd = htmlString.match(/\/?>/);
                    var firstSpaceLocation = htmlString.indexOf(" ");
                    var tagNameEndLocation = startTagEndLocation < firstSpaceLocation || firstSpaceLocation < 0 ? startTagEndLocation : firstSpaceLocation;
                    var tagName = htmlString.substring(1, tagNameEndLocation);

                    self.getAttributesFromTag(htmlString.substring(0, startTagEndLocation) + startTagEnd, child.attributes);

                    child.name = tagName;
                    child.parentNode = parent;
                    child.previousSibling = previousSibling;

                    if(child.name.search(/body/i) >= 0)
                        parsedHTML.body = child;
                    else if(child.name.search(/head/i) >= 0)
                        parsedHTML.head = child;
                    else if(child.name.search(/!doctype/i) >= 0){
                        parsedHTML.docType = child;
                    }

                    var endTagBeginLocation = htmlString.indexOf("</" + tagName);
                    if(endTagBeginLocation >= 0){

                        //get children of this tag
                        getTags(htmlString.substring(startTagEndLocation, endTagBeginLocation), child.childNodes, child, null);

                        child.innerHTML = htmlString.substring(startTagEndLocation + 1, endTagBeginLocation);
                        child.outerHTML = htmlString.substring(0, endTagBeginLocation + ("/" + tagName + ">" + 1).length);

                        //add children of object to the object itself
                        childList.push(child);

                        //go to next sibling
                        child.nextSibling = getTags(htmlString.substring(endTagBeginLocation + ("</" + tagName).length), childList, parent, child);

                        return child;
                    }else{
                        childList.push(child);
                        child.nextSibling = getTags(htmlString.substring(startTagEndLocation), childList, parent, child);
                        return child;
                    }
                }
            })(htmlString, parsedHTML.childNodes, null, null);

            return parsedHTML;
        },
        getAttributesFromTag: function(tagString, attrsList){
            if(tagString.search(/^<\s+/) >= 0) throw new Error("Improperly Formed Tag: " + tagString);

            var attrRegEx = /[^<.*\s]*\s*=\s*((['][^']*['])|(["][^"]*["])|([^'"\s]*\s))/g;
            var attrsAndValues = tagString.match(attrRegEx);

            //if there is no match, then check to see if the tag consists of only stand alone attributes
            if(attrsAndValues == null){
               getStandAloneAttributes(tagString, attrsList, true);
            }else {
                tagString = tagString.replace(attrRegEx, "");
                 var standaloneAttrs = tagString.match(/\s*.*\s*\/?>?/g);
                //getStandAloneAttributes(tagString, attrsAndValues, false);
                attrsAndValues.concat(standaloneAttrs);
                for(var i = 0; i < attrsAndValues.length; i++){
                    var av = attrsAndValues[i];
                    var indexOfEquals = av.indexOf("=");
                    if(indexOfEquals < 0){
                        attrsList.push({name: av.trim(), value: null});
                    }else{
                        var name = av.substring(0, indexOfEquals).trim();
                        var value = av.substring(indexOfEquals + 1).trim();
                        attrsList.push({name: name, value: value.replace(/^["'](.*)["']$/, '$1')});
                    }
                }
            }

            function getStandAloneAttributes(standAloneAttrsString, attributesList, containsOnlyStandAlone){
                var standAloneAttrsList = standAloneAttrsString.split(" ");

                for(var i = 0; i < standAloneAttrsList.length; i++){
                    var attr = standAloneAttrsList[i];
                    var rightAngleBracketLocation = attr.indexOf(">");
                    attr = rightAngleBracketLocation < 0 ? attr : attr.substring(0, rightAngleBracketLocation);
                    if(attr.indexOf("<") < 0 && attr.search(/\s*\/?>/) != 0 && attr != "")
                        containsOnlyStandAlone ? attrsList.push({name: attr, value: null}) :attributesList.push(attr);
                }
            }
        }
    }
})(window);
