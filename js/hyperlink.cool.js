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
        if (document.activeElement) {
            setActiveClass(document.activeElement)
        }
    }, true)



    /**
     * Listen to various key presses to enable arrow key navigation over the record links.
     * Opening links is done by giving links focus which has the desired interaction by default
     *
     * Some keys and which keycodes they’re mapped to:
     * `tab` – 9;   `return` – 13;   `←` – 37;   `↑` – 38;   `→` – 39;   `↓` – 40;
     */
    document.addEventListener("keydown", function(e) {
        e = e || window.event
        var key = e.keyCode
        var recordList = document.getElementById(listName)

        // If `e.keyCode` is not in the array, abort mission right away
        if ([9, 13, 37, 38, 39, 40].indexOf(key) === -1 || !recordList.hasChildNodes()) {
            return
        }

        var activeLink = recordList.getElementsByClassName(activeLinkName)[0]

        // If the record input is currently active …
        if (document.activeElement === document.getElementById(inputName)) {
            // … and the user presses return or mouse down
            if ([13, 40].indexOf(key) > -1) {
                // … make the first link in the record list the active item
                recordList.getElementsByClassName(linkName)[0].focus()
                // Prevent scrolling the viewport on mouse down
                if (key === 40) {
                    e.preventDefault()
                }
            }
            // We’re done here.
            return
        } else if (key === 13) {
            // If return was pressed without the record input being active, we’re done.
            return
        }

        var targetElement

        if (key === 9) {
            // Determine which element is the one that will receive focus
            var elements = focusableElements()
            for (var i = 0; i < elements.length; i++) {
                if (elements[i] === document.activeElement) {
                    if (event.shiftKey && elements[i-1] != undefined) {
                        targetElement = elements[i-1]
                    } else if (elements[i+1] != undefined) {
                        targetElement = elements[i+1]
                    }
                }
            }
        } else if ([37, 39].indexOf(key) > -1) {
            var previousLink
            var nextLink
            var linkElements = recordList.getElementsByClassName(linkName)
            for (var i = 0; i < linkElements.length; i++) {
                if (activeLink === linkElements[i]) {
                    previousLink = linkElements[i-1]
                    nextLink = linkElements[i+1]
                    break
                }
            }

            if (!previousLink && !nextLink) {
                return
            }

            if (key === 37 && previousLink !== undefined) {
                targetElement = previousLink
            } else if (key === 39 && nextLink !== undefined) {
                targetElement = nextLink
            }
        } else if ([38, 40].indexOf(key) > -1) {
            var activeItem = findAncestor(activeLink, itemName)
            var previousItem = activeItem.previousElementSibling
            var nextItem = activeItem.nextElementSibling

            if (!previousItem && !nextItem) {
                return
            }

            if (key === 38 && previousItem !== undefined) {
                targetElement = previousItem.getElementsByClassName(linkName)[0]
            } else if (key === 40 && nextItem !== undefined) {
                targetElement = nextItem.getElementsByClassName(linkName)[0]
            }

        }

        if (targetElement !== undefined
            && targetElement.classList.contains(linkName)) {
            if ([37, 38, 39, 40].indexOf(key) > -1) {
                e.preventDefault()
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



    /**
     * @return  the closest ancestor of `element` that has a class `className`
     */
    function findAncestor(element, className) {
        while (
            (element = element.parentElement) &&
            !element.classList.contains(className)
        ) {
            return element
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
            element = elements[i]
            if (element.tabIndex > -1 && element.offsetParent !== null) {
                focusable.push(element)
            }
        }
        return focusable
    }
}
