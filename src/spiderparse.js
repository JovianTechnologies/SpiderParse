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

                    //todo: Throw error if tag is improper
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
            var attrDelineatorsRegex = /\s+[^=]|['"]|\s*\/?>/;
            var attrLocation = tagString.search(attrDelineatorsRegex);
            var endTagSymbolRegex = /\s*"?\/?>$/;

            if(tagString.search(endTagSymbolRegex) > 0 && attrLocation >= 0 && tagString != ""){
                tagString = tagString.substring(attrLocation + 1).trim();

                var attr;
                var assignmentOperatorLocation;
                var attrEndLocation = tagString.search(attrDelineatorsRegex);
                //if the delineatorRegex finds a match at the beginning of the tag then we have likely
                //come across a string attribute
                if(attrEndLocation == 0){
                    var quoteAttributeRegex =/^["][^"]*["]|^['][^']*[']/;
                    attr = tagString.match(quoteAttributeRegex)[0];
                }else{
                    attr = tagString.substring(0, attrEndLocation);
                    //if the attribute does not contain an equals sign check ahead to make sure there aren't multiple spaces
                    //between it and its equal sign to make sure it is really a stand alone attribute
                    assignmentOperatorLocation = attr.indexOf("=");
                    if(assignmentOperatorLocation < 0 && tagString.search(/^\w+\s*=/) == 0) {
                        attr = tagString.match(/^\w+\s*=/)[0];
                        //reassign assignmentOperator location since the operator was found
                        assignmentOperatorLocation = attr.indexOf("=");
                    }
                }

                //make sure there are no spaces in the attribute name and that the attribute name isn't blank
                if(attr != "" ){
                    //parse attribute name
                    var name = assignmentOperatorLocation >= 0  ? attr.substring(0,assignmentOperatorLocation).trim() : attr;

                    //remove attribute name from tagstring so that we only have to deal with the value and the remaing
                    //attributes in the tag
                    tagString = tagString.substring(assignmentOperatorLocation + 1).trim();

                    //parse attribute value
                    var valueRegex = /^[^'"\s]*[\s\/>]|^["][^"]*["]|^['][^']*[']/;
                    var value = assignmentOperatorLocation < 0 ? null : tagString.match(valueRegex)[0];
                    var trimmedValue = value == null ? null : value.trim();

                    if (trimmedValue != null) {
                        //remove any extra "'s
                        trimmedValue = trimmedValue.replace(/^["']/, '');
                        trimmedValue = trimmedValue.replace(/["']$/, '');

                        //if last character is / or > remove it
                        var lastForwardSlashLocation = trimmedValue.lastIndexOf("/");
                        var lastRightAngleBracketLocation = trimmedValue.lastIndexOf(">");
                        if (lastForwardSlashLocation >= 0 && lastForwardSlashLocation == trimmedValue.length - 2)
                            trimmedValue = trimmedValue.substring(0, lastForwardSlashLocation);
                        else if (lastRightAngleBracketLocation >= 0 && lastRightAngleBracketLocation == trimmedValue.length - 1)
                            trimmedValue = trimmedValue.substring(0, lastRightAngleBracketLocation);
                    }

                    attrsList.push({name: name, value: trimmedValue});

                    var remainingTagString;

                    //set remainingTagString based on whether the attribute added was standalone
                    if(assignmentOperatorLocation < 0) {
                        remainingTagString = tagString.substring(attr.length);
                    }else {
                        remainingTagString = tagString.substring(trimmedValue.length + 1);
                        //if this was preceded by a non quoted value add the quote
                        //this is done to differentiate attributes from the tag name
                        //attributes will either be seperated by spaces or quotes
                        //the delineatorRegex above would not be able to filter out the tag name without delineating by space
                        //so thw quote is added so that a tag after an unquoted value will not be ignored
                        //todo:Come up with a more clear explaination
                        if(remainingTagString.search(/^['"]/) < 0)
                            remainingTagString = "'" + remainingTagString;
                    }

                    if(remainingTagString.search(/^["']\s*\/?>/) < 0 && remainingTagString != "") {
                        this.getAttributesFromTag(remainingTagString, attrsList);
                    }
                }
            }
        }
    }
})(window);
