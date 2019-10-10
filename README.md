# hyperlink.cool

[hyperlink.cool](https://hyperlink.cool) is a searchable link collection for my fellow Computer Science and Media students at Bauhaus-Univerität Weimar.

## Developing

Install the project’s dependencies:

```
npm install
```

Start a local development server:

```
npm start
```

Build the project and upload the contents of the `_site` directory:

```
npm run build
```

## Contributing

If you want to add your own course, please go ahead and edit the [records.json](https://github.com/kleinfreund/hyperlink.cool/blob/gh-pages/_data/records.json) file and file a pull request.

An example record looks something like this:

```json
{
  "key": "web",
  "title": "Webtechnologie",
  "keywords": [
    "web",
    "wt",
    "4. Semester"
  ],
  "persons": [
    "Benno Stein",
    "Johannes Kiesel",
    "Martin Potthast"
  ],
  "links": [
    {
      "title": "Uni-Website",
      "key": "web",
      "url": "https://www.uni-weimar.de/en/media/chairs/webis/teaching/ss-2018/web-technology/"
    }
  ]
}
```

If you rather not edit the file yourself, you may as well [open a new issue](https://github.com/kleinfreund/hyperlink.cool/issues/new). Please remember to add all the necessary information about the course or whatever you want me to add.
