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
            var standaloneAttrs;
            //if there is no match, then check to see if the tag consists of only stand alone attributes
            if(attrsAndValues == null){
                standaloneAttrs = tagString.match(/\s+[^\s\/>]*/g);

                if(standaloneAttrs == null) return;

                for(var i = 0; i < standaloneAttrs.length; i++)
                    attrsList.push({name: standaloneAttrs[i].trim(), value: null});

            }else {
                tagString = tagString.replace(attrRegEx, "");
                standaloneAttrs = tagString.match(/\s+[^\s\/>]*/g);
                attrsAndValues = attrsAndValues.concat(standaloneAttrs);

                for(var i = 0; i < attrsAndValues.length; i++){
                    var av = attrsAndValues[i];

                    if(av == null) continue;

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
        }
    }
})(window);
