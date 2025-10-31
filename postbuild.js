/* eslint-env es6 */
const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');
const prj = JSON.parse(fs.readFileSync('./package.json'));
const dirName = `./dist/${prj.name}/browser`;

// find the styles css file
const files = getFilesFromPath(dirName, '.css');
let data = [];

if (!files && files.length <= 0) {
    console.log("cannot find style files to purge");
    process.exit();
}

for (let f of files) {
    // get original file size
    const originalSize = getFilesizeInKiloBytes(dirName + '/' + f) + "kb";
    var o = { "file": f, "originalSize": originalSize, "newSize": "" };
    data.push(o);
}

function getFilesizeInKiloBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size / 1024;
    return fileSizeInBytes.toFixed(3);
}

function getFilesFromPath(dir, extension) {
    if (!fs.existsSync(dir)) {
        console.error('Dir not exist');
        process.exit();
    }
    let files = fs.readdirSync(dir);
    return files.filter(e => path.extname(e).toLowerCase() === extension);
}

console.log("Run PurgeCSS...");
(new PurgeCSS()).purge({
    content: [`${dirName}/*.html`, `${dirName}/*.js`],
    css: [`${dirName}/*.css`],
    output: `${dirName}/`
}).then((r) => {
    const file = r[0].file;
    const css = r[0].css;
    fs.writeFile(file, css, { encoding: 'utf8' }, () => {
        console.log("PurgeCSS done");
        for (let d of data) {
            // get new file size
            const newSize = getFilesizeInKiloBytes(file) + "kb";
            d.newSize = newSize;
        }

        console.table(data);
    });
}).catch(e => {
    console.error(e);
    process.exit();
})
