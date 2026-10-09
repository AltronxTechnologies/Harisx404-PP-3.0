import fs from "fs";
import path from "path";

const srcDir = "d:/IT/Harisx404-PP-3.0/blogs";
const dstDir = "d:/IT/Harisx404-PP-3.0/content/blog";
const backupDir = "d:/IT/Harisx404-PP-3.0/content/blog_legacy_backup";

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 1. Move all existing legacy files in content/blog to backup
for (const file of fs.readdirSync(dstDir)) {
  if (file.endsWith(".mdx")) {
    fs.renameSync(path.join(dstDir, file), path.join(backupDir, file));
  }
}
console.log("Archived legacy blog files to content/blog_legacy_backup");

// 2. Copy the 10 original blogs to content/blog with both prefixed and slug-only filenames for maximum compatibility
for (const file of fs.readdirSync(srcDir)) {
  if (file.endsWith(".mdx")) {
    const content = fs.readFileSync(path.join(srcDir, file), "utf8");
    // e.g. 01-securing-ai-agents.mdx
    fs.writeFileSync(path.join(dstDir, file), content, "utf8");
    // also slug-only: securing-ai-agents.mdx
    const slugOnly = file.replace(/^\d+-/, "");
    if (slugOnly !== file) {
      fs.writeFileSync(path.join(dstDir, slugOnly), content, "utf8");
    }
    console.log(`Copied ${file} -> content/blog/`);
  }
}

console.log("Local content/blog directory is now up to date with original blogs!");
