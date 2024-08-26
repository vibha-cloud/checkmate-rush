const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "views", "index.ejs");
const outputPath = path.join(__dirname, "public", "index.html");

ejs.renderFile(templatePath, { title: "My EJS Site" }, {}, function (err, str) {
  if (err) {
    console.error("Error rendering EJS:", err);
  } else {
    fs.writeFileSync(outputPath, str);
  }
});
