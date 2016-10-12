# hyperlink.cool

[hyperlink.cool](https://hyperlink.cool) is a searchable link collection for my fellow Computer Science and Media students at Bauhaus-Univerität Weimar.

## Contributing

If you want to add your own course, please go ahead and edit the [records.json](https://github.com/kleinfreund/hyperlink.cool/blob/gh-pages/_data/records.json) file and file a pull request.

An example record looks something like this:

```json
"eidi": {
    "key": "eidi",
    "title": "Einführung in die Informatik",
    "abbr": "EidI",
    "keywords": ["EI"],
    "persons": ["Matthias Hagen"],
    "links": [
        {
            "title": "Interner Bereich",
            "url": "http://webuser.uni-weimar.de/~fuce7538/eidi/"
        }
    ]
}
```

If you rather not edit the file yourself, you may as well [open a new issue](https://github.com/kleinfreund/hyperlink.cool/issues/new). Please remember to add all the necessary information about the course or whatever you want me to add.

## To Do

- Gulp tasks for …:
  - Building the site with Jekyll (also handles Sass)
  - previewing the site via a local server
  - watching the directory for changes
  - detecting dead links with something like HTMLProofer
