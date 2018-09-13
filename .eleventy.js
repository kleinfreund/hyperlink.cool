const htmlMinifier = require('html-minifier');

// https://github.com/kangax/html-minifier#options-quick-reference
const htmlMinifierOptions = {
  useShortDoctype: true,
  removeComments: true,
  collapseWhitespace: true
};

module.exports = function (eleventyConfig) {
  // Copies static files as they are to the output directory
  eleventyConfig
    .addPassthroughCopy('_data')
    .addPassthroughCopy('img')
    .addPassthroughCopy('css')
    .addPassthroughCopy('js')
    .addPassthroughCopy('favicon.ico')
    .addPassthroughCopy('.htaccess')
    .addPassthroughCopy('manifest.webmanifest');

  // Compresses output HTML
  eleventyConfig.addTransform('htmlmin', minifyHtml);

  return {
    templateFormats: ['md', 'html', 'liquid']
  };
};

/**
 * Minifies HTML content.
 *
 * @param {String} content
 * @param {String} outputPath
 * @returns {String} the minified HTML content
 */
function minifyHtml(content, outputPath) {
  if (outputPath.endsWith('.html')) {
    return htmlMinifier.minify(content, htmlMinifierOptions);
  }

  return content;
}
