# svg-stringify
### extract path to from svg files and generate an index

---
useful for replacing inline svg, without losing ability to change colors

add script to your package.json

```editorconfig
svg-stringify {pathToSvgIcons}
```

generates "import-SvgIconsFolder.js" and typescript module

Can be used in [Quasar's](https://quasar.dev) iconMapFn to create custom icon sets



### Attributions:
Icon normalization: [pathfit library](https://github.com/ccprog/pathfit)

Svg parsing library: [svg-parser](https://github.com/Rich-Harris/svg-parser)

Beautifier: [js-beautify](https://github.com/beautify-web/js-beautify)
