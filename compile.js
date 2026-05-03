const fs = require('fs');
const babel = require('@babel/core');

const html = fs.readFileSync('catalog.html', 'utf8');

// Extract content between <script type="text/babel"> and its closing </script>
const start = html.indexOf('<script type="text/babel">') + '<script type="text/babel">'.length;
const end = html.indexOf('</script>', start);
const jsx = html.slice(start, end);

// Compile JSX → plain JS
const result = babel.transformSync(jsx, {
  plugins: ['@babel/plugin-transform-react-jsx'],
  retainLines: true, // keep line numbers for debugging
});

fs.writeFileSync('app.js', result.code, 'utf8');
console.log('✅ app.js compiled successfully (' + Math.round(result.code.length / 1024) + ' KB)');
