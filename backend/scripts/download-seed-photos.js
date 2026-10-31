const fs = require('fs');
const path = require('path');
const https = require('https');

const destDir = path.join(__dirname, '..', '..', 'frontend', 'assets', 'images', 'seed');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Curated high-quality Unsplash photos (direct Unsplash source URLs with dimensions and quality parameters)
const photos = [
  { name: 'music_guitar.jpg', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&q=80&fit=crop' },
  { name: 'fitness_gym.jpg', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&q=80&fit=crop' },
  { name: 'photography_camera.jpg', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&q=80&fit=crop' },
  { name: 'delhi_monument.jpg', url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1000&q=80&fit=crop' },
  { name: 'kerala_backwaters.jpg', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1000&q=80&fit=crop' },
  { name: 'street_food_chaat.jpg', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1000&q=80&fit=crop' },
  { name: 'remote_work_terrace.jpg', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=80&fit=crop' },
  { name: 'mechanical_keyboard.jpg', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&q=80&fit=crop' },
  { name: 'student_hackathon.jpg', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&q=80&fit=crop' },
  { name: 'design_sketchbook.jpg', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&q=80&fit=crop' },
  { name: 'runner_morning.jpg', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&q=80&fit=crop' },
  { name: 'cricket_bat.jpg', url: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?w=1000&q=80&fit=crop' },
  { name: 'coffee_latte_art.jpg', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&q=80&fit=crop' },
  { name: 'pottery_craft.jpg', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1000&q=80&fit=crop' },
  { name: 'night_sky_stars.jpg', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1000&q=80&fit=crop' },
];

const downloadFile = (item) => {
  return new Promise((resolve) => {
    const destPath = path.join(destDir, item.name);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
      console.log(`Already exists: ${item.name}`);
      return resolve(true);
    }

    const file = fs.createWriteStream(destPath);
    https.get(item.url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Downloaded: ${item.name} (${fs.statSync(destPath).size} bytes)`);
            resolve(true);
          });
        }).on('error', (err) => {
          console.error(`Error downloading ${item.name}:`, err.message);
          resolve(false);
        });
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${item.name} (${fs.statSync(destPath).size} bytes)`);
          resolve(true);
        });
      }
    }).on('error', (err) => {
      console.error(`Error downloading ${item.name}:`, err.message);
      resolve(false);
    });
  });
};

(async () => {
  console.log('Downloading additional seed photos...');
  for (const p of photos) {
    await downloadFile(p);
  }
  console.log('Done downloading photos.');
})();
