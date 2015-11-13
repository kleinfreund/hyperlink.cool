function recordFilter(jsonFile, containerName, inputID) {
    // Variable that stores the list data from the JSON file
    var listData;

    // Some names that are repeatedly used as HTML class or ID names
    var listName = 'record-list';
    var itemName = 'record';

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

    window.onkeydown = function(e) {
        e = e || window.event;

        // If `e.keyCode` is not in the array, abort mission right away
        // `enter` – 13;   `esc` – 27;   `←` – 37;   `↑` – 38;   `→` – 39;   `↓` – 40;
        if ([13, 27, 37, 38, 39, 40].indexOf(e.keyCode) === -1) {
            return;
        }

        var activeItemName = itemName + '--active';
        var activeLinkName = itemName + '__link--active';
        var activeItems = document.getElementsByClassName(activeItemName);
        var activeLinks = document.getElementsByClassName(activeLinkName);

        // Determine in which element has the active state: list or link item?
        if (activeItems.length > 0 && activeLinks.length > 0) {
            // Bad voodoo happened. This should not be possible.
            console.log('Both list and link items have an active class. This should not happen.');
        } else if (activeItems.length > 0) {
            // A list item is active
            // Cancel on `←`, and `Esc` key presses. We don’t need them here.
            if ([27, 37].indexOf(e.keyCode) > -1) {
                return;
            }

            // Else, we don’t want the default interaction to trigger.
            e.preventDefault();

            var activeItem = activeItems[0];
            var targetItem;

            if ([13, 39].indexOf(e.keyCode) > -1) {
                var linkItems = activeItem.getElementsByClassName(itemName + '__link');
                activeItem.classList.remove(activeItemName);
                linkItems[0].className += '  ' + itemName + '__link--active';

                // We’re done here
                return;
            } else if (e.keyCode === 38) {
                targetItem = activeItem.previousSibling;
            } else if (e.keyCode === 40) {
                targetItem = activeItem.nextSibling;
            }

            if (targetItem !== null) {
                if (targetItem.className.indexOf(itemName) > -1) {
                    activeItem.classList.remove(activeItemName);
                    targetItem.className += '  ' + activeItemName;

                    // List items have `tabindex="-1"` so they can get the focus without interupting
                    // regular tabbing through links. This, conveniently, scrolls them into the viewport.
                    targetItem.focus();
                }
            }
        } else if (activeLinks.length > 0) {
            // A link item is active, prevent the default interaction for the pressed key
            e.preventDefault();

            var activeItem = activeLinks[0];
            var targetItem;

            if (e.keyCode === 27 || ([37, 38].indexOf(e.keyCode) > -1 && activeItem.previousElementSibling === null)) {
                function findAncestor(el, cls) {
                    while ((el = el.parentElement) && !el.classList.contains(cls));
                    return el;
                }

                var parentListItem = findAncestor(activeLinks[0], itemName);
                activeLinks[0].classList.remove(activeLinkName);
                parentListItem.className += '  ' + activeItemName;

                return;
            } else if (e.keyCode === 13) {
                // window.open(activeLinks[0].href, '_blank');
                location = activeLinks[0].href;

                return;
            } else if ([37, 38].indexOf(e.keyCode) > -1) {
                targetItem = activeItem.previousSibling;
            } else if ([39, 40].indexOf(e.keyCode) > -1) {
                targetItem = activeItem.nextSibling;
            }

            if (targetItem !== null) {
                if (targetItem.className.indexOf(itemName + '__link') > -1) {
                    activeItem.classList.remove(activeLinkName);
                    targetItem.className += '  ' + activeLinkName;
                }
            }
        }
    };

    // Build a course item that represents one course in the course list
    function buildListItem(list, key, value) {
        var courseStr = '<li class="' + itemName + '  ' + itemName + '--' + key
            + '" data-abbr="' + value.abbr
            + '" tabindex="-1">'
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

        // Set the first child element in the list to active state
        var firstItem = list.firstElementChild;
        if (firstItem !== null) {
            if (firstItem.className.indexOf(itemName) > -1) {
                var activeClass = itemName + '--active';
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
