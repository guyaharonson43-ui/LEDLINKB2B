const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIRS = ['strips'];
const QUALITY = 82;

async function convertDir(dir) {
  const files = fs.readdirSync(dir);
  const images = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  let saved = 0, totalBefore = 0, totalAfter = 0;

  for (const file of images) {
    const src = path.join(dir, file);
    const dest = path.join(dir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    if (fs.existsSync(dest)) continue; // skip already converted

    const before = fs.statSync(src).size;
    try {
      await sharp(src).webp({ quality: QUALITY }).toFile(dest);
      const after = fs.statSync(dest).size;
      totalBefore += before; totalAfter += after;
      saved++;
      process.stdout.write('.');
    } catch (e) {
      console.error('\nSkipped ' + file + ': ' + e.message);
    }
  }
  return { saved, totalBefore, totalAfter };
}

(async () => {
  // Convert hero.jpg
  if (!fs.existsSync('hero.webp')) {
    const b = fs.statSync('hero.jpg').size;
    await sharp('hero.jpg').webp({ quality: QUALITY }).toFile('hero.webp');
    const a = fs.statSync('hero.webp').size;
    console.log('hero.jpg → hero.webp: ' + Math.round(b/1024) + 'KB → ' + Math.round(a/1024) + 'KB');
  }

  // Convert strips/
  process.stdout.write('Converting strips/ ');
  const { saved, totalBefore, totalAfter } = await convertDir('strips');
  console.log('\n✅ ' + saved + ' images converted');
  console.log('   Before: ' + Math.round(totalBefore/1024) + 'KB → After: ' + Math.round(totalAfter/1024) + 'KB');
  console.log('   Saved:  ' + Math.round((totalBefore-totalAfter)/1024) + 'KB (' + Math.round((1-totalAfter/totalBefore)*100) + '%)');
})();
