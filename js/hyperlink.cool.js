"use strict"

// Contains the JSON data
var listData
// Input IT of the record filtering element
var inputName

function init(jsonFile, inputName_) {
    inputName = inputName_

    var getJSON = function(jsonFile, successHandler, errorHandler) {
        // Get the JSON data by using a XML http request
        var xhr = new XMLHttpRequest()
        xhr.open('GET', jsonFile)
        xhr.addEventListener('load', function() {
            var status
            var data
            if (xhr.readyState === 4) {
                status = xhr.status
                if (status === 200) {
                    data = JSON.parse(xhr.responseText)
                    successHandler && successHandler(data);
                } else {
                    errorHandler && errorHandler(status);
                }
            }
        })
        xhr.send(null)
    };

    getJSON(jsonFile, function(data) {
        listData = data
    }, function(status) {
        console.log('Error: ' + status)
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // If some content is hidden via CSS, the js-disabled HTML class is set on
    // the body. Remove it, so potentially interactive elements become usable.
    if (document.body.classList.contains('js-disabled')) {
        document.body.classList.remove('js-disabled')
    }

    var loop = function() {
        // Check if listData is available …
        if (listData !== undefined) {
            // … if so, start the record filter
            recordFilter()
        } else {
            // … if not, check again in 100ms
            window.setTimeout(loop, 100);
        }
    }
    loop();
});

function recordFilter() {
    // Some names that are repeatedly used as HTML class or ID names
    var listName = 'record-list'
    var itemName = 'record'
    var linkName = itemName + '__link'
    var activeLinkName = linkName + '--active'

    var placeholderKeys = []
    for (var key in listData) {
        var value = listData[key]
        placeholderKeys = placeholderKeys.concat(
            value.title, value.abbr, value.keywords
        )
    }

    var filterInput = document.getElementById(inputName)
    filterInput.focus()
    filterInput.placeholder = placeholderKeys[
        Math.floor(Math.random() * placeholderKeys.length)
    ]

    if (filterInput.value.length > 0) {
        buildRecordList(filterKeys(filterInput.value))
    }

    var recordList = document.getElementById(listName)
    if (recordList.firstElementChild !== null) {
        setActiveClass(recordList.firstElementChild.getElementsByClassName(linkName)[0])
    }



    var timer
    // Watch the search field for input changes …
    filterInput.addEventListener('input', function(e) {
        // … and build a new record list according to the filter value
        timer && clearTimeout(timer)
        timer = setTimeout(function() {
            buildRecordList(filterKeys(filterInput.value))
        }, 150)
    }, false)

    document.addEventListener('focus', function(e) {
        if (document.activeElement !== null) {
            setActiveClass(document.activeElement)
        }
    }, true)



    /*
    * Part of the navigation module.
    * Determines the target element that will be focused on pressing a certain key.
    */
    function findTargetElement(keyCode, reverseDirection) {
        var recordList = document.getElementById(listName)
        var activeLink = recordList.querySelector('.' + activeLinkName)

        var keyCodeNames = {
            tab: 9,
            return: 13,
            arrowLeft: 37,
            arrowUp: 38,
            arrowRight: 39,
            arrowDown: 40,
        }

        var targetElement

        if (keyCode === keyCodeNames.tab) {
            // Determine which element is the one that will receive focus
            var elements = focusableElements()
            for (var i = 0; i < elements.length; i++) {
                if (elements[i] === document.activeElement) {
                    targetElement = elements[i + (reverseDirection ? -1 : 1)]
                }
            }
        } else if ([keyCodeNames.arrowLeft, keyCodeNames.arrowRight].indexOf(keyCode) > -1) {
            var linkElements = recordList.getElementsByClassName(linkName)
            for (var j = 0; j < linkElements.length; j++) {
                if (activeLink === linkElements[j]) {
                    targetElement = linkElements[j + (keyCode === keyCodeNames.arrowLeft ? -1 : 1)]
                }
            }
        } else if ([keyCodeNames.arrowUp, keyCodeNames.arrowDown].indexOf(keyCode) > -1) {
            var activeItem = activeLink.getAncestorByClassName(itemName)
            var targetItem = keyCode === keyCodeNames.arrowUp ? activeItem.previousElementSibling : activeItem.nextElementSibling

            if (targetItem !== null) {
                targetElement = targetItem.querySelector('.' + linkName)
            }
        }

        if (targetElement !== undefined) {
            return targetElement
        }

        // A target element could not be determined. Returning `null` explicitly reflects that.
        return null
    }



    /**
     * Listen to various key presses to enable arrow key navigation over the record links.
     * Opening links is done by giving links focus which has the desired interaction by default
     */
    document.addEventListener("keydown", function(event) {
        event = event || window.event
        var keyCode = event.keyCode
        var recordList = document.getElementById(listName)

        // If `recordList` has no entries, stop
        if (!recordList.hasChildNodes()) return

        // Store all used keyCode values in a map-like object
        var keyCodeNames = {
            tab: 9,
            return: 13,
            arrowLeft: 37,
            arrowUp: 38,
            arrowRight: 39,
            arrowDown: 40,
        }

        // Create an array of all values in `keyCodeNames`
        var keyCodeValues = Object.keys(keyCodeNames).map(function(keyCode) {
            return keyCodeNames[keyCode]
        })

        // If `keyCode` is not in `keyCodeValues`, stop
        if (keyCodeValues.indexOf(keyCode) === -1) return

        // Determine which keys require special actions. For all other keys, return
        var inputElementIsActive = document.activeElement === document.getElementById(inputName)
        if (inputElementIsActive) {
            // All keys except return and arrowDown don’t require any special actions in this case
            keyCodeValues = [keyCodeNames.return, keyCodeNames.arrowDown]
        } else {
            // Only return doesn’t require a special action in this case
            keyCodeValues.splice(keyCodeValues.indexOf(keyCodeNames.return), 1)
        }

        // If `keyCode` is not in `keyCodeValues`, stop
        if (keyCodeValues.indexOf(keyCode) === -1) return

        // If the record input is currently active …
        if (inputElementIsActive) {
            // … make the first link in the record list the active item
            recordList.querySelector('.' + linkName).focus()

            // Prevent scrolling the viewport on mouse down
            if (keyCode === keyCodeNames.arrowDown) {
                event.preventDefault()
            }

            return
        }

        var activeLink = recordList.querySelector('.' + activeLinkName)

        var targetElement = findTargetElement(keyCode, event.shiftKey)

        if (targetElement !== null && targetElement.classList.contains(linkName)) {
            if ([37, 38, 39, 40].indexOf(keyCode) > -1) {
                event.preventDefault()
                targetElement.focus()
            }
            activeLink.classList.remove(activeLinkName)
            targetElement.className += '  ' + activeLinkName
        }
    })



    /**
     * Takes a string to search for in `listData` to create an array of related keys.
     * @return  An array consisting of key strings which are related to `str`.
     */
    function filterKeys(str) {
        if (str.length === 0) {
            var allKeys = []
            for (var key in listData) {
                allKeys.push(key)
            }
            return allKeys
        }

        var recordObjects = []
        for (var objectKey in listData) {
            recordObjects.push(listData[objectKey])
        }
        var options = {
            keys: ['abbr', 'title', 'keywords', 'persons', 'links.title'],
            id: 'key'
        }
        var fuse = new Fuse(recordObjects, options)
        return fuse.search(str)
    }



    /**
     * Build the record list containing elements belonging to keys in `relatedKeys`.
     */
    function buildRecordList(relatedKeys) {
        var recordListStr = ''
        for (var i = 0; i < relatedKeys.length; i++) {
            recordListStr += recordStr(relatedKeys[i], listData[relatedKeys[i]])
        }

        var recordList = document.getElementById(listName)
        recordList.innerHTML = recordListStr

        if (recordList.hasChildNodes()) {
            // Set the first child element in the list to active state
            setActiveClass(
                recordList.firstElementChild.getElementsByClassName(linkName)[0]
            )
        }
    }



    /**
     * @return  a string that contains the HTML markup for a record
     */
    function recordStr(key, value) {
        var str = '<li class="' + itemName + '" data-key="' + value.key + '">' +
            '<div class="' + itemName + '__title">' + value.title + '</div>'

        if (value.links.length > 0) {
            str += '<nav class="nav  record-nav">'
            for (var i = 0; i < value.links.length; i++) {
                var link = value.links[i]
                str += '<a class="' + itemName + '__link" href="'
                    + link.url + '">' + link.title + '</a>'
            }
        }

        str += '</nav></li>'

        return str
    }



    /**
     * @brief  Moves the active class to the given element
     */
    function setActiveClass(element) {
        if (element !== undefined) {
            if (element.className.indexOf(linkName) > -1) {
                var recordList = document.getElementById(listName)
                var activeItem = recordList
                    .getElementsByClassName(activeLinkName)[0]

                if (activeItem !== undefined) {
                    activeItem.classList.remove(activeLinkName)
                }
                element.className += '  ' + activeLinkName
            }
        }
    }
}



/*
* Determine the closest ancestor of an element that has a certain class
*/
Element.prototype.getAncestorByClassName = function(className) {
    var currentParent = this.parentElement;
    while (true) {
        // If the root of the DOM is reached, an ancestor cannot be found anymore.
        if (currentParent === null) {
            return null
        }

        if (currentParent.classList.contains(className)) {
            return currentParent
        }

        var currentParent = currentParent.parentElement;
    }
}



/**
 * @brief  Iterates over all current DOM elements to create an array of elements that are
 *         focusable (i.e. they’re visible and have a tabIndex greater -1)
 * @return  an array containing all currently focusable elements in the DOM
 */
function focusableElements() {
    var elements = document.getElementsByTagName('*')
    var focusable = []
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i]
        if (element.tabIndex > -1 && element.offsetParent !== null) {
            focusable.push(element)
        }
    }
    return focusable
}
