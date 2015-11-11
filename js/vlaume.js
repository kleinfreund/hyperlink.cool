function listFilter(jsonFile, filterId) {
    // Variable that stores the course data from the JSON file
    var listData;
    var listItemClass = 'list-item';

    // Get the JSON data by using a XML http request
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

    // Wait for the document to be ready
    window.onload = function(e) {
        buildList();

        var input = document.getElementById(filterId);

        var keyArray = []
        for (var key in listData) {
            keyArray = keyArray.concat(listData[key].names);
        }

        input.placeholder = keyArray[Math.floor(Math.random() * keyArray.length)];;

        // Watch the search field for input changes …
        input.addEventListener('input', function(e) {
            // … and filter the course list
            filterCourseList(input.value);
        }, false);
    };

    // Build a course item that represents one course in the course list
    function buildListItem(list, key, value) {
        var courseStr = '<li class="' + listItemClass + '  ' + listItemClass + '--' + key
            + '" data-abbr="' + value.abbr + '">'
            + '<div class="' + listItemClass + '__title">' + value.title + '</div>'
            + '<ul class="nav">';

        for (var link in value.links) {
            if (!link.hasOwnProperty(link)) {
                courseStr += '<li><a href="' + value.links[link] + '">' + link + '</a></li>';
            }
        }

        list.innerHTML += courseStr;
    }

    // Populate the course list
    function buildList() {
        var list = document.createElement('ul');
        list.id = 'course-list';
        list.className = 'course-list';

        for (var key in listData) {
            if (!key.hasOwnProperty(key)) {
                buildListItem(list, key, listData[key]);
            }
        }

        var input = document.getElementById(filterId);
        input.parentNode.insertBefore(list, input.nextSibling);
    }

    // Check whether an array contains strings that contain `substring`
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
     * Filters the course list by removing all list items that are not related
     * to `searchStr`.
     * What’s related is determined by `listData[course].names`
     */
    function filterCourseList(searchStr) {
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

        // Remove unrelated courses
        for (var i = 0; i < unrelatedKeys.length; i++) {
            // Check whether there are any course items …
            var listItems = document.getElementsByClassName(listItemClass + '--' + unrelatedKeys[i]);
            while (listItems.length > 0) {
                // … and remove them
                listItems[0].parentNode.removeChild(listItems[0]);
            }
        }

        // Add missing courses
        for (var i = 0; i < relatedKeys.length; i++) {
            var relatedKey = relatedKeys[i]
            // Check whether the course item already exists …
            if (document.getElementsByClassName(listItemClass + '--' + relatedKeys[i]).length === 0) {
                // … and add it otherwise
                buildListItem(document.getElementById('course-list'), relatedKey, listData[relatedKey]);
            }
        }
    }
}
