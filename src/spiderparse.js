(function(window){
    var attributesRegex = /[^<.*\s]*\s*=\s*'\w+[^(\s+\w+\s*=\s*.*|\/?>)]*/g;
    window.SpiderParse = {
        parse: function(htmlString){
            var self = this;

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
            var delineatorsRegex = /\s|['"]|\s*\/?>/;
            var attrLocation = tagString.search(delineatorsRegex);
            if(tagString.search(/\s*"?\/?>$/) > 0 && attrLocation >= 0 && tagString != ""){
                tagString = tagString.substring(attrLocation + 1).trim();

                //if the delineatorRegex finds a match at the beginning of the tag then we have likely
                //come across a string attribute
                var attr;
                if(tagString.search(delineatorsRegex) == 0){
                    attr = tagString.match(/^["][^"]*["]|^['][^']*[']/)[0];
                }else{
                    attr = tagString.substring(0, tagString.search(delineatorsRegex));
                }

                //make sure there are no spaces in the attribute name and that the attribute name isn't blank
                if(attr != "" ){
                    //parse attribute name
                    var assignmentOperatorLocation = attr.indexOf("=");
                    var name = assignmentOperatorLocation >= 0  ? attr.substring(0,assignmentOperatorLocation).trim() : attr;

                    //parse attribute value
                    tagString = tagString.substring(assignmentOperatorLocation + 1);
                    var valueRegex = /^[^'"]*[\s\/>]|^["][^"]*["]|^['][^']*[']/;
                    var value = assignmentOperatorLocation < 0 ? null : tagString.match(valueRegex)[0];
                    var trimmedValue = value == null ? null : value.trim();

                    if (trimmedValue != null) {
                        //remove any extra "'s
                        trimmedValue = trimmedValue.replace(/^"(.*)"$/, '$1');

                        //if last character is / or > remove it
                        if (trimmedValue.lastIndexOf("/") == trimmedValue.length - 2)
                            trimmedValue = trimmedValue.substring(0, trimmedValue.lastIndexOf("/"));
                        else if (trimmedValue.lastIndexOf(">") == trimmedValue.length - 1)
                            trimmedValue = trimmedValue.substring(0, trimmedValue.lastIndexOf(">"));
                    }

                    attrsList.push({name: name, value: trimmedValue});

                    if (assignmentOperatorLocation < 0) {
                        var subtag1 = tagString.substring(tagString.indexOf(attr) + attr.length);
                        if(subtag1.search(/^"\s*\/?>/) < 0 && subtag2 != "")
                            this.getAttributesFromTag(subtag1, attrsList);
                    } else {
                        var subtag2 = tagString.substring(tagString.indexOf(trimmedValue) + trimmedValue.length);
                        if(subtag2.search(/^"\s*\/?>/) < 0 && subtag2 != "")
                            this.getAttributesFromTag(subtag2, attrsList);
                    }

                }
            }
        }
    }
})(window);
