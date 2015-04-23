/**
 * Created by Eric on 4/23/2015.
 */
(function(window){
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

            /**
             * Get all attributes and thier values from a tag
             * @param tagString
             * @param attrsList
             */
            function getTagAttributes(tagString, attrsList){
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
                    if(!attr.search(/\s+/ && !attr.search(/^$/))){
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
                            if(subtag1 != "\">" && subtag1 != "")
                                getTagAttributes(subtag1, attrsList);
                        } else {
                            var subtag2 = tagString.substring(tagString.indexOf(trimmedValue) + trimmedValue.length);
                            if(subtag2 >= "\">" && subtag2 != "")
                                getTagAttributes(subtag2, attrsList);
                        }

                    }
                }
            }

            /**
             * Recursively find all tags in the document, and their children
             * @param htmlString
             * @param childList
             * @returns {*}
             */
            (function getTags(htmlString, childList, parent, previousSibling){
                var startTagBeginLocation = htmlString.indexOf("<");
                if(startTagBeginLocation >= 0 ){
                    htmlString = htmlString.substring(startTagBeginLocation);
                    startTagBeginLocation = 0;

                    var child = new SpiderNode();

                    //get tag by either finding a space or the end of the tag
                    var startTagEndLocation = htmlString.substring(startTagBeginLocation).search(/\/?>/);
                    var startTagEnd = htmlString.match(/\/?>/);
                    var firstSpaceLocation = htmlString.substring(startTagBeginLocation).indexOf(" ");
                    var tagNameEndLocation = startTagEndLocation < firstSpaceLocation || firstSpaceLocation < 0 ? startTagEndLocation : firstSpaceLocation;
                    var tagName = htmlString.substring(startTagBeginLocation + 1, tagNameEndLocation);

                    getTagAttributes(htmlString.substring(startTagBeginLocation, startTagEndLocation) + startTagEnd, child.attributes);

                    child.name = tagName;
                    child.parentNode = parent;
                    child.previousSibling = previousSibling;

                    if(child.name.search(/body/i) >= 0)
                        self.html.body = child;
                    else if(child.name.search(/head/i) >= 0)
                        self.html.head = child;
                    else if(child.name.search(/!doctype/i) >= 0){
                        self.html.docType = child;
                    }

                    var endTagBeginLocation = htmlString.indexOf("</" + tagName);
                    if(endTagBeginLocation >= 0){

                        //get children of this tag
                        getTags(htmlString.substring(startTagEndLocation, endTagBeginLocation), child.childNodes, child, null);

                        child.innerHTML = htmlString.substring(startTagEndLocation + 1, endTagBeginLocation);
                        child.outerHTML = htmlString.substring(startTagBeginLocation, endTagBeginLocation + ("/" + tagName + ">" + 1).length);

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
            })(htmlString, this.html.childNodes, null, null);

            return this.html;
        },
        html: {
            body: {},
            childNodes: [],
            docType: {
                name: "",
                publicId:"",
                systemId:""
            },
            head: {}
        }
    }
})(window);
