function recordFilter(jsonFile, containerName, inputID) {
    // Some names that are repeatedly used as HTML class or ID names
    var listName = 'record-list';
    var itemName = 'record';
    var linkName = itemName + '__link';
    var activeLinkName = linkName + '--active';

    // Get the JSON data by using a XML http request
    var listData;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', jsonFile, false);
    xhr.onload = function(e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                listData = JSON.parse(xhr.responseText);
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function(e) {
        console.error(xhr.statusText);
    };
    xhr.send(null);



    /**
     * Before the record list can be build, the DOM has to be loaded so we can hook into the input.
     */
    window.onload = function(e) {
        // Some things that are only usable when JavaScript is enabled are hidden by default.
        // Removing the `js-disabled` class makes them visible again.
        if (document.body.classList.contains('js-disabled')) {
            document.body.classList.remove('js-disabled');
            document.body.className += ' js-enabled';
        }

        var placeholderKeys = [];
        for (var key in listData) {
            placeholderKeys = placeholderKeys.concat(listData[key].names);
        }

        var filterInput = document.getElementById(inputID);
        filterInput.placeholder = placeholderKeys[Math.floor(Math.random() * placeholderKeys.length)];

        if (filterInput.value.length > 0) {
            buildList(filterList(filterInput.value));
        }

        setActiveClass();

        // Watch the search field for input changes …
        filterInput.addEventListener('input', function(e) {
            // … and build a new record list according to the filter value
            buildList(filterList(filterInput.value));
        }, false);
    };



    /**
     * @return  the closest ancestor of `element` with a class `className`
     */
    function findAncestor(element, className) {
        while ((element = element.parentElement) && !element.classList.contains(className));
        return element;
    }



    function focusableElements() {
        var elements = document.getElementsByTagName('*');
        var focusable = [];
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].tabIndex > -1 && elements[i].offsetParent !== null) {
                focusable.push(elements[i]);
            }
        }
        return focusable;
    }



    /**
     * Listen to various key presses to enable arrow key navigation over the record links.
     * Opening links is done by giving links focus which has the desired interaction by default
     *
     * Some keys and which keycodes they’re mapped to:
     * `tab` – 9;   `enter` – 13;   `←` – 37;   `↑` – 38;   `→` – 39;   `↓` – 40;
     */
    window.onkeydown = function(e) {
        e = e || window.event;

        var list = document.getElementById(listName);

        // If `e.keyCode` is not in the array, abort mission right away
        if ([9, 13, 37, 38, 39, 40].indexOf(e.keyCode) === -1 || !list.hasChildNodes()) {
            return;
        }

        var activeLink = list.getElementsByClassName(activeLinkName)[0];

        if (e.keyCode === 13) {
            if (document.activeElement === document.getElementById(inputID)) {
                document.activeElement.blur();
                activeLink.focus();
            } else {
                return;
            }
        }

        var targetElement;

        if (e.keyCode === 9) {
            // If there is only one item, the default is fine.
            if (list.length === 1) {
                return;
            }

            var elements = focusableElements();
            var activeElement = document.activeElement;

            // Determine which element is the one that will receive focus
            for (var el = 0; el < elements.length; el++) {
                if (elements[el] === activeElement) {
                    if (e.shiftKey && elements[el-1]) {
                        targetElement = elements[el-1];
                    } else if (elements[el+1]) {
                        targetElement = elements[el+1];
                    }
                    break;
                }
            }
        }

        if ([37, 39].indexOf(e.keyCode) > -1) {
            var previousLink;
            var nextLink;
            var linkElements = list.getElementsByClassName(linkName);
            for (var i = 0; i < linkElements.length; i++) {
                if (activeLink === linkElements[i]) {
                    previousLink = linkElements[i-1];
                    nextLink = linkElements[i+1];
                    break;
                }
            }

            if (!previousLink && !nextLink) {
                return;
            }

            if (e.keyCode === 37 && previousLink) {
                targetElement = previousLink;
            } else if (e.keyCode === 39 && nextLink) {
                targetElement = nextLink;
            }
        } else if ([38, 40].indexOf(e.keyCode) > -1) {
            var activeItem = findAncestor(activeLink, itemName);
            var previousItem = activeItem.previousElementSibling;
            var nextItem = activeItem.nextElementSibling;

            if (!previousItem && !nextItem) {
                return;
            }

            if (e.keyCode === 38 && previousItem) {
                targetElement = previousItem.getElementsByClassName(linkName)[0];
            } else if (e.keyCode === 40 && nextItem) {
                targetElement = nextItem.getElementsByClassName(linkName)[0];
            }

        }

        if (targetElement && targetElement.classList.contains(linkName)) {
            if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
                targetElement.focus();
            }
            activeLink.classList.remove(activeLinkName);
            targetElement.className += '  ' + activeLinkName;
        }
    };



    /**
     * @return  a string that contains the HTML markup for a link item
     */
    function listItemStr(key, value) {
        var str = '<li class="' + itemName + '" data-key="' + key + '">' +
            '<div class="' + itemName + '__title">' + value.title + '</div>' +
            '<nav class="nav  record-nav">';
        for (var link in value.links) {
            str += '<a class="' + itemName + '__link" href="' + value.links[link] + '">' + link + '</a>';
        }
        return str;
    }



    /**
     * Build the record list containing elements belonging to keys in `relatedKeys`.
     */
    function buildList(relatedKeys) {
        // Check if a list was build previously …
        var list = document.getElementById(listName);
        if (list) {
            // … and remove its content
            list.innerHTML = '';
        } else {
            // … otherwise, create it
            list = document.createElement('ul');
            list.id = list.className = listName;
            document.getElementById(containerName).insertBefore(list, null);
        }

        for (var key in listData) {
            if (relatedKeys.indexOf(key) > -1) {
                list.innerHTML += listItemStr(key, listData[key]);
            }
        }

        // If no list items were inserted, we need to stop here
        if (!list.hasChildNodes()) {
            return;
        }

        // Set the first child element in the list to active state
        setActiveClass();
    }



    function setActiveClass() {
        var list = document.getElementById(listName);
        var firstItem = list.firstElementChild.getElementsByClassName(linkName)[0];
        if (firstItem) {
            if (firstItem.className.indexOf(linkName) > -1) {
                var activeItem = list.getElementsByClassName(activeLinkName)[0];
                if (activeItem) {
                    activeItem.classList.remove(activeLinkName);
                }
                firstItem.className += '  ' + activeLinkName;
            }
        }
    }



    /**
     * Checks whether `array` contains strings that contain `substring`.
     * @return  true if the substring was found, false otherwise.
     */
    function arrayContainsSubstring(array, substring) {
        var lowercaseArray = array.map(function(item) {
            return item.toLowerCase();
        });
        for (var i = 0; i < lowercaseArray.length; i++) {
            if (lowercaseArray[i].indexOf(substring.toLowerCase()) > -1) {
                return true;
            }
        }
        return false;
    }



    /**
     * Takes a string to search for in `listData` to create an array of related keys.
     * @return  An array consisting of key strings which are related to `str`.
     */
    function filterList(str) {
        var relatedKeys = [];
        for (var key in listData) {
            if (arrayContainsSubstring(listData[key].names, str)) {
                relatedKeys.push(key);
            }
        }
        return relatedKeys;
    }
}
