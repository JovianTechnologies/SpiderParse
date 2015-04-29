(function(window){
    window.SpiderParse = {
        parse: function(htmlString){
            var self = this;

            var parsedHTML = { children:[], childNodes:[] };
            var doc = document.implementation.createHTMLDocument("");
            (function getTags(htmlString, childNodes, children, parent, previousSibling){
                var getAllNodesRegex = /(<[^<>]*)|((?!><)(>[^<>]*))/g;
                var allNodes = htmlString.match(getAllNodesRegex);

                (function getTagsHelper (nodes, parent, inc){
                    var currentChild = nodes[0];
                    var isTextNode = currentChild.charAt(0) == ">";

                    var index = 1;
                    var closeTagCounter =  1;
                    if(!isTextNode) {
                        nameEndIndex = currentChild.search(/\s/);
                        name  = nameEndIndex < 0 ? currentChild.substring(1):currentChild.substring(1, nameEndIndex);

                        //find end tag for this element
                        while (closeTagCounter > 0) {
                            if (index >= nodes.length)break;

                            if (nodes[index].indexOf("<" + name) >= 0)
                                closeTagCounter++;
                            else if (nodes[index].indexOf("</" + name) >= 0)
                                closeTagCounter--;

                            if (closeTagCounter == 0) break;

                            index++;
                        }
                    }

                    var element;
                    var nameEndIndex;
                    var name;
                    if(isTextNode)
                        element = doc.createTextNode(currentChild.substring(1));
                    else{
                        element = doc.createElement(name);
                        self.getAttributesFromTag(currentChild, element);
                    }

                    //check if this is tag has an end tag.
                    if(index >= nodes.length || isTextNode){
                        if(parent == null) parsedHTML.children.push(element);
                        else parent.appendChild(element);

                        var nextNodes = nodes.slice(1, nodes.length);
                        if(nextNodes.length > 0)
                            getTagsHelper(nextNodes, parent);

                    }else{
                        //get children if there are any
                        var cNodes = nodes.slice(1, index);
                        var childinc = 1;
                        if(cNodes.length > 0)childinc = childinc + getTagsHelper(cNodes, element, inc++);
                        if(parent == null) parsedHTML.children.push(element);
                        else parent.appendChild(element);

                        //get next sibling
                        var sibinc = 1;
                        if(index + 1 < nodes.length)
                            sibinc = sibinc + getTagsHelper(nodes.slice(index + 1), parent, inc++);

                        return sibinc + childinc;

                    }
                })(allNodes, null);
            })(htmlString, parsedHTML.childNodes, parsedHTML.children, null, null);

            return parsedHTML;
        },
        getAttributesFromTag: function(tagString, element){
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
                    if(attr != "")element.setAttribute(attr, null);
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
                        element.setAttribute(name, null);
                    }else{
                        var name = av.substring(0, indexOfEquals).trim();
                        var value = av.substring(indexOfEquals + 1).trim();
                        if(name != "" && name != '')element.setAttribute(name, value.replace(/^["'](.*)["']$/, '$1'));
                    }
                }
            }
        }
    }
})(window);