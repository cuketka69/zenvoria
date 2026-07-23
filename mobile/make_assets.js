// Generates the source images @capacitor/assets needs (assets/icon.png, icon-foreground.png,
// icon-background.png, splash.png) from the site's existing logo.webp, on the brand green (#0A5A34).
const sharp = require('sharp');
const path = require('path');

const LOGO = path.join(__dirname, '..', 'logo.webp');
const OUT = path.join(__dirname, 'assets');
const BRAND = { r: 0x0a, g: 0x5a, b: 0x34, alpha: 1 };

async function main() {
  require('fs').mkdirSync(OUT, { recursive: true });

  // plain square icon: logo scaled with some padding, flattened onto brand green
  const iconSize = 1024;
  const logoOnIcon = Math.round(iconSize * 0.72);
  const logoBufIcon = await sharp(LOGO).resize(logoOnIcon, logoOnIcon, { fit: 'contain' }).toBuffer();
  await sharp({ create: { width: iconSize, height: iconSize, channels: 4, background: BRAND } })
    .composite([{ input: logoBufIcon, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, 'icon.png'));

  // adaptive icon: separate foreground (logo, transparent bg, smaller so it survives masking) + background (solid)
  const logoOnFg = Math.round(iconSize * 0.55);
  const logoBufFg = await sharp(LOGO).resize(logoOnFg, logoOnFg, { fit: 'contain' }).toBuffer();
  await sharp({ create: { width: iconSize, height: iconSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logoBufFg, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, 'icon-foreground.png'));
  await sharp({ create: { width: iconSize, height: iconSize, channels: 4, background: BRAND } })
    .png()
    .toFile(path.join(OUT, 'icon-background.png'));

  // splash screen: logo centered on brand green, large canvas
  const splashSize = 2732;
  const logoOnSplash = Math.round(splashSize * 0.32);
  const logoBufSplash = await sharp(LOGO).resize(logoOnSplash, logoOnSplash, { fit: 'contain' }).toBuffer();
  await sharp({ create: { width: splashSize, height: splashSize, channels: 4, background: BRAND } })
    .composite([{ input: logoBufSplash, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, 'splash.png'));
  // dark variant identical for now (brand bg is already dark)
  await sharp(path.join(OUT, 'splash.png')).toFile(path.join(OUT, 'splash-dark.png'));

  console.log('OK: wrote icon.png, icon-foreground.png, icon-background.png, splash.png(+dark) to', OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
