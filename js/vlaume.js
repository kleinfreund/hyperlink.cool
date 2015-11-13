function recordFilter(jsonFile, containerName, inputID) {
    // Some names that are repeatedly used as HTML class or ID names
    var listName = 'record-list';
    var itemName = 'record';
    var linkName = itemName + '__link';
    var activeLinkName = linkName + '--active';

    // Get the JSON data by using a XML http request
    var listData;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', jsonFile, false );
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
        var placeholderKeys = [];
        for (var key in listData) {
            placeholderKeys = placeholderKeys.concat(listData[key].names);
        }

        var filterInput = document.getElementById(inputID);
        filterInput.placeholder = placeholderKeys[Math.floor(Math.random() * placeholderKeys.length)];

        buildList(filterList(filterInput.value));

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
        if ([13, 37, 38, 39, 40].indexOf(e.keyCode) === -1 || !list.hasChildNodes()) {
            return;
        }

        if (e.keyCode === 13) {
            if (document.activeElement === document.getElementById(inputID)) {
                document.activeElement.blur();
            } else {
                return;
            }
        }

        var activeLink = list.getElementsByClassName(activeLinkName)[0];

        var targetLink;
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
                targetLink = previousLink;
            } else if (e.keyCode === 39 && nextLink) {
                targetLink = nextLink;
            }
        } else if ([38, 40].indexOf(e.keyCode) > -1) {
            var activeItem = findAncestor(activeLink, itemName);
            var previousItem = activeItem.previousElementSibling;
            var nextItem = activeItem.nextElementSibling;

            if (!previousItem && !nextItem) {
                return;
            }

            if (e.keyCode === 38 && previousItem) {
                targetLink = previousItem.getElementsByClassName(linkName)[0];
            } else if (e.keyCode === 40 && nextItem) {
                targetLink = nextItem.getElementsByClassName(linkName)[0];
            }
        }

        if (targetLink) {
            e.preventDefault();

            activeLink.classList.remove(activeLinkName);
            targetLink.className += '  ' + activeLinkName;

            // List items have `tabindex="-1"` so they can get the focus without interupting
            // regular tabbing through links. This, conveniently, scrolls them into the viewport.
            targetLink.focus();
        }
    };



    /**
     * @return  a string that contains the HTML markup for a link item
     */
    function listItemStr(key, value) {
        var str = '<li class="' + itemName + '" data-abbr="' + value.abbr + '">' +
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
        var firstItem = list.firstElementChild.getElementsByClassName(linkName)[0];
        if (firstItem) {
            if (firstItem.className.indexOf(linkName) > -1) {
                var activeItem = list.getElementsByClassName(activeLinkName)[0];
                if (activeItem !== undefined) {
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
