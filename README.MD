# Simple SA Mission Manager
This Simple SA Mission Manager works by replacing the main.scm / script.img files under the scripts folder and the american.gxt file under the text folder. This allows you to easily package mission packs into zip files with descriptions about the mission pack. To create a mission pack, all you need to include are the info.json, main.scm and american.gxt files in the zip file (script.img is optional).

The info.json file should contain the following json structure,
```JSON
{
  "name" : "Name of the mission pack",
  "author" : "The name of the person authoring this mission pack",
  "about" : "Description of the mission pack",
  "version" : "1.0.0"
}
```
