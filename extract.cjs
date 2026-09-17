const fs = require('fs');
const content = fs.readFileSync('index_original.html', 'utf8');

const cssStart = content.indexOf('<style>') + '<style>'.length;
const cssEnd = content.indexOf('</style>', cssStart);
fs.writeFileSync('src/index.css', content.substring(cssStart, cssEnd).trim());

const scriptTag = '<script type="text/babel" data-type="module" data-presets="react">';
const jsStart = content.indexOf(scriptTag) + scriptTag.length;
const jsEnd = content.indexOf('</script>', jsStart);
fs.writeFileSync('src/App.jsx', content.substring(jsStart, jsEnd).trim());
