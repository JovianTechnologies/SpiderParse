(function(window){
    window.SpiderParse = {
        parse: function(htmlString){
            var self = this;

            var SpiderNode = function(){
                this.name = "";
                this.attributes = [];
                this.children = [];
                this.childNodes = [];
                this.parentNode = null;
                this.nextSibling = null
                this.previousSibling = null;
                this.innerHTML = "";
                this.outerHTML = "";

                this.createElement = function(){
                    var element;

                    if(this.name == "textNode")
                        element = document.createTextNode(this.value);
                    else{
                        element = document.createElement(this.name);

                        for(var i = 0; i < this.attributes.length; i++){
                            var attr = this.attributes[i];
                            element.setAttribute(attr.name, attr.value);
                        }

                        for(var i = 0; i < this.childNodes.length; i++){
                            var child  = this.childNodes[i];
                            var childElement = child.createElement();
                            element.appendChild(childElement);
                        }
                    }

                    return element;
                }
            };

            var parsedHTML = { children:[], childNodes:[] };

            (function getTags(htmlString, childNodes, children, parent, previousSibling){
                var startTagBeginLocation= htmlString.indexOf("<");
                var startTextNodeBeginLocation = htmlString.search(/(?!\/>)([^<>])/);
                var startLocation;
                var isTextNode;
                if(startTagBeginLocation < startTextNodeBeginLocation){
                    startLocation = startTagBeginLocation;
                    isTextNode = false;
                }else{
                    startLocation = startTextNodeBeginLocation;
                    isTextNode = true;
                }
                if(startLocation >= 0 ) {
                    htmlString = htmlString.substring(startLocation);

                    var child = new SpiderNode();

                    if (isTextNode) {
                        var endOfText = htmlString.indexOf("<");
                        child.attributes = null;
                        child.name = "textNode";
                        child.value = htmlString.substring(0, endOfText);
                        child.innerHTML = null;
                        child.outerHTML = null;
                        child.parentNode = parent;
                        child.previousSibling = previousSibling;

                        childNodes.push(child);

                        child.nextSibling = getTags(htmlString.substring(endOfText), childNodes, children, parent, child);

                        return child;
                    } else {
                        //get tag by either finding a space or the end of the tag
                        var startTagEndLocation = htmlString.search(/\/?>/);
                        var firstSpaceLocation = htmlString.indexOf(" ");
                        var tagNameEndLocation = startTagEndLocation < firstSpaceLocation || firstSpaceLocation < 0 ? startTagEndLocation : firstSpaceLocation;
                        var tagName = htmlString.substring(1, tagNameEndLocation);

                        self.getAttributesFromTag(htmlString.substring(0, startTagEndLocation), child.attributes);

                        child.name = tagName;
                        child.parentNode = parent;
                        child.previousSibling = previousSibling;

                        var endTagBeginLocation = htmlString.indexOf("</" + tagName);
                        if (endTagBeginLocation > 0) {
                            if(child.name == "br"){
                                var stopHere = "";
                                var test = "";
                            }
                            //get children of this tag
                            getTags(htmlString.substring(startTagEndLocation, endTagBeginLocation),child.childNodes, child.children, children, null);

                            child.innerHTML = htmlString.substring(startTagEndLocation + 1, endTagBeginLocation);
                            child.outerHTML = htmlString.substring(0, endTagBeginLocation + ("/" + tagName + ">" + 1).length);

                            childNodes.push(child);
                            children.push(child);

                            //go to next sibling
                            child.nextSibling = getTags(htmlString.substring(endTagBeginLocation + ("</" + tagName).length), childNodes, children, parent, child);

                            return child;
                        } else {
                            if(child.name == "br"){
                                var stopHere = "";
                                var test = "";
                            }
                            childNodes.push(child);
                            children.push(child);
                            child.nextSibling = getTags(htmlString.substring(startTagEndLocation), childNodes, children, parent, child);
                            return child;
                        }
                    }
                }
            })(htmlString, parsedHTML.childNodes, parsedHTML.children, null, null);

            return parsedHTML;
        },
        getAttributesFromTag: function(tagString, attrsList){
            if(tagString.search(/^<\s+/) >= 0) throw new Error("Improperly Formed Tag: " + tagString);

            var attrRegEx = /[^<.*\s'"]*\s*=\s*((['][^']*['])|(["][^"]*["])|([^'"\s]*\s))/g;
            var attrsAndValues = tagString.match(attrRegEx);
            var standaloneAttrs;

            //if there is no match, then check to see if the tag consists of only stand alone attributes
            if(attrsAndValues == null){
                standaloneAttrs = tagString.match(/\s+[^\s\/>]*/g);

                if(standaloneAttrs == null) return;

                for(var i = 0; i < standaloneAttrs.length; i++) {
                    var attr = standaloneAttrs[i].trim();
                    if(attr != "")attrsList.push({name: attr, value: null});
                }
            }else {
                tagString = tagString.replace(attrRegEx, "");
                standaloneAttrs = tagString.match(/\s+[^\s\/>]*/g);
                attrsAndValues = attrsAndValues.concat(standaloneAttrs);

                for(var i = 0; i < attrsAndValues.length; i++){
                    var av = attrsAndValues[i];

                    if(av == null) continue;

                    var indexOfEquals = av.indexOf("=");
                    var name = av.trim();
                    if(indexOfEquals < 0 && name != "" && name != ''){
                        attrsList.push({name: name, value: null});
                    }else{
                        var name = av.substring(0, indexOfEquals).trim();
                        var value = av.substring(indexOfEquals + 1).trim();
                        if(name != "" && name != '')attrsList.push({name: name, value: value.replace(/^["'](.*)["']$/, '$1')});
                    }
                }
            }
        }
    }
})(window);