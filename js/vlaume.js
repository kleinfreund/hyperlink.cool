function recordFilter(jsonFile, containerName, inputID) {
    // Variable that stores the list data from the JSON file
    var listData;

    // Some names that are repeatedly used as HTML class or ID names
    var listName = 'record-list';
    var itemName = 'record';
    var linkName = itemName + '__link';

    // Get the JSON data by using a XML http request
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

    // Wait for the document to be ready
    window.onload = function(e) {
        var placeholderKeys = []
        for (var key in listData) {
            placeholderKeys = placeholderKeys.concat(listData[key].names);
        }

        var inputElement = document.getElementById(inputID);
        inputElement.placeholder = placeholderKeys[Math.floor(Math.random() * placeholderKeys.length)];

        var keys = filterList(inputElement.value);
        buildList(keys[0], keys[1]);

        // Watch the search field for input changes …
        inputElement.addEventListener('input', function(e) {
            // … and filter the course list
            var keys = filterList(inputElement.value);
            buildList(keys[0], keys[1]);
        }, false);
    };

    function findAncestor(element, className) {
        while ((element = element.parentElement) && !element.classList.contains(className));
        return element;
    }

    window.onkeydown = function(e) {
        e = e || window.event;

        var list = document.getElementById(listName);

        // If `e.keyCode` is not in the array, abort mission right away
        // `tab` – 9;   `enter` – 13;   `←` – 37;   `↑` – 38;   `→` – 39;   `↓` – 40;
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

        var activeLinkName = linkName + '--active';
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

            if (previousLink === nextLink) {
                return;
            }

            if (e.keyCode === 37 && previousLink !== null) {
                targetLink = previousLink;
            } else if (e.keyCode === 39 && nextLink !== null) {
                targetLink = nextLink;
            }
        } else if ([38, 40].indexOf(e.keyCode) > -1) {
            var activeItem = findAncestor(activeLink, itemName);
            var previousItem = activeItem.previousElementSibling;
            var nextItem = activeItem.nextElementSibling;

            if (previousItem === nextItem) {
                return;
            }

            if (e.keyCode === 38 && previousItem !== null) {
                targetLink = previousItem.getElementsByClassName(linkName)[0];
            } else if (e.keyCode === 40 && nextItem !== null) {
                targetLink = nextItem.getElementsByClassName(linkName)[0];
            }
        }

        if (targetLink !== (null || undefined)) {
            e.preventDefault();

            activeLink.classList.remove(activeLinkName);
            targetLink.className += '  ' + activeLinkName;

            // List items have `tabindex="-1"` so they can get the focus without interupting
            // regular tabbing through links. This, conveniently, scrolls them into the viewport.
            targetLink.focus();
        }
    };

    // Build a course item that represents one course in the course list
    function buildListItem(list, key, value) {
        var courseStr = '<li class="' + itemName + '  ' + itemName + '--' + key
            + '" data-abbr="' + value.abbr + '">'
            + '<div class="' + itemName + '__title">' + value.title + '</div>'
            + '<nav class="nav  link-list">';

        for (var link in value.links) {
            if (!link.hasOwnProperty(link)) {
                courseStr += '<a class="' + itemName + '__link" href="' + value.links[link] + '">' + link + '</a>';
            }
        }

        list.innerHTML += courseStr;
    }

    // Populate the list
    function buildList(relatedKeys, unrelatKeys) {
        relatedKeys = relatedKeys || [];
        unrelatKeys = unrelatKeys || [];

        // Check if a list was build previously so we can reuse it
        var list = document.getElementById(listName);
        if (list === null) {
            // Create it otherwise
            list = document.createElement('ul');
            list.id = listName;
            list.className = listName;
        } else {
            list.innerHTML = '';
        }

        for (var key in listData) {
            if (!key.hasOwnProperty(key)) {
                if ((relatedKeys.length === 0 && unrelatKeys.length === 0) || relatedKeys.indexOf(key) > -1) {
                    buildListItem(list, key, listData[key]);
                }
            }
        }

        if (!list.hasChildNodes()) {
            return;
        }

        // Set the first child element in the list to active state
        var firstItem = list.firstElementChild.getElementsByClassName(linkName)[0];
        if (firstItem !== null) {
            if (firstItem.className.indexOf(linkName) > -1) {
                var activeClass = linkName + '--active';
                var activeItems = list.getElementsByClassName(activeClass);
                for (var i = 0; i < activeItems.length; i++) {
                    activeItems[i].classList.remove(activeClass);
                }

                firstItem.className += '  ' + activeClass;
            }
        }

        document.getElementById(containerName).insertBefore(list, null);
    }

    // Check whether `array` contains strings that contain `substring`
    function arrayContainsSubstring(array, substring) {
        var lowercaseArray = array.map(function(item) {
            return item.toLowerCase();
        })

        for (var i = 0; i < lowercaseArray.length; i++) {
            if (lowercaseArray[i].indexOf(substring.toLowerCase()) > -1) {
                return true;
            }
        }

        return false;
    }

    /**
     * Filters the list by splitting the list keys into related and unrelated ones.
     * What’s related is determined by `listData[key].names`
     *
     * @return  A two-item array consisting of `relatedKeys` and `unrelatedKeys`
     */
    function filterList(searchStr) {
        // Separate related and unrelated course keys
        var unrelatedKeys = [];
        var relatedKeys = [];
        for (var key in listData) {
            if (!key.hasOwnProperty(key)) {
                if (arrayContainsSubstring(listData[key].names, searchStr)) {
                    relatedKeys.push(key);
                } else {
                    unrelatedKeys.push(key);
                }
            }
        }

        return [relatedKeys, unrelatedKeys];
    }
}
