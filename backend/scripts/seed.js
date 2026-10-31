const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Story = require('../models/Story');

// Production safety check
if (env.isProduction && !process.argv.includes('--force')) {
  console.error('Error: Seeding is blocked in production environment. Pass --force to override.');
  process.exit(1);
}

const DEMO_PASSWORD = 'Demo@123';

const usersData = [
  {
    name: 'Aditya Verma',
    username: 'demo',
    email: 'demo@sangam.in',
    bio: 'Software engineer building modern web experiences. Clean code, distributed systems, and filter coffee.',
    avatarHue: 215,
    bannerPreset: 0,
  },
  {
    name: 'Priya Sharma',
    username: 'priyasharma',
    email: 'priya@sangam.in',
    bio: 'Design engineer & UI artisan. Exploring View Transitions, fluid typography, and delightful micro-motion.',
    avatarHue: 330,
    bannerPreset: 1,
  },
  {
    name: 'Arjun Nair',
    username: 'arjun_tech',
    email: 'arjun@sangam.in',
    bio: 'Backend architect & systems hacker. Living between Bengaluru tech corridors and Indiranagar cafes.',
    avatarHue: 160,
    bannerPreset: 2,
  },
  {
    name: 'Ananya Iyer',
    username: 'ananyaiyer',
    email: 'ananya@sangam.in',
    bio: 'AI researcher working on edge inference. Filter coffee enthusiast in Chennai. Reading classic sci-fi.',
    avatarHue: 280,
    bannerPreset: 3,
  },
  {
    name: 'Rohit Malhotra',
    username: 'rohit_cricket',
    email: 'rohit@sangam.in',
    bio: 'Cricket analyst, club cricketer & stats nerd. Bleeding blue at Wankhede stadium.',
    avatarHue: 38,
    bannerPreset: 4,
  },
  {
    name: 'Sneha Patel',
    username: 'sneha_patel',
    email: 'sneha@sangam.in',
    bio: 'Product Designer at a high-growth fintech. Crafting frictionless, human journeys.',
    avatarHue: 350,
    bannerPreset: 5,
  },
  {
    name: 'Vikram Singh',
    username: 'vikram_singh',
    email: 'vikram@sangam.in',
    bio: 'Building India’s next-gen logistics infrastructure. Angel investor & marathon enthusiast.',
    avatarHue: 195,
    bannerPreset: 6,
  },
  {
    name: 'Pooja Reddy',
    username: 'poojareddy',
    email: 'pooja@sangam.in',
    bio: 'Culinary explorer & food writer in Hyderabad. On a mission to discover the best dum biryani in town.',
    avatarHue: 25,
    bannerPreset: 7,
  },
  {
    name: 'Karan Mehta',
    username: 'karan_mehta',
    email: 'karan@sangam.in',
    bio: 'CS sophomore @IITB. System design, competitive programming, and weekend hackathons.',
    avatarHue: 260,
    bannerPreset: 1,
  },
  {
    name: 'Meera Kapoor',
    username: 'meera_kapoor',
    email: 'meera@sangam.in',
    bio: 'Travel photographer traveling through Spiti, Ladakh, and the Konkan coast. Capturing Indian stories.',
    avatarHue: 175,
    bannerPreset: 2,
  },
  {
    name: 'Aman Joshi',
    username: 'aman_music',
    email: 'aman@sangam.in',
    bio: 'Indie guitarist & sound designer in Pune. Making acoustic morning tracks and exploring generative audio.',
    avatarHue: 45,
    bannerPreset: 3,
  },
  {
    name: 'Tara Sen',
    username: 'tara_fitness',
    email: 'tara@sangam.in',
    bio: 'Trail runner, calisthenics coach & nutritionist. Celebrating movement and outdoor adventures.',
    avatarHue: 140,
    bannerPreset: 4,
  },
  {
    name: 'Devika Nair',
    username: 'devika_arch',
    email: 'devika@sangam.in',
    bio: 'Heritage architect documenting traditional stepwells, palaces, and sustainable urban living.',
    avatarHue: 20,
    bannerPreset: 5,
  },
  {
    name: 'Kabir Das',
    username: 'kabirdas',
    email: 'kabir@sangam.in',
    bio: 'Early-stage founder building developer tooling. Minimalist design, fast tools, zero noise.',
    avatarHue: 205,
    bannerPreset: 6,
  },
];

// Helper to compute realistic past timestamps
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);
const daysAgo = (d, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600 * 1000);

const postsData = [
  // 1. Tech - AI Hardware
  {
    authorUsername: 'ananyaiyer',
    text: 'Testing our quantized neural models directly on the new neural co-processors. Getting sub-5ms latency without thermal throttling. The edge AI revolution is moving at breakneck speed. #tech #ai #hardware',
    image: '/assets/images/seed/ai_chip.jpg',
    createdAt: hoursAgo(2),
  },
  // 2. Music
  {
    authorUsername: 'aman_music',
    text: 'Early morning acoustic session in the studio. New riff in D-minor that feels like autumn rain. Working on our upcoming EP. What music are you listening to today? #music #acoustic #indie',
    image: '/assets/images/seed/music_guitar.jpg',
    createdAt: hoursAgo(3),
  },
  // 3. Fitness
  {
    authorUsername: 'tara_fitness',
    text: 'Hit a 5:00 AM deadlift PR before the city woke up. Consistency over intensity every single time. Discipline is doing what you love even when you do not feel like it. #fitness #workout #motivation',
    image: '/assets/images/seed/fitness_gym.jpg',
    createdAt: hoursAgo(5),
  },
  // 4. Mumbai
  {
    authorUsername: 'demo',
    text: 'Driving across the Bandra-Worli Sea Link at golden hour never gets old. Mumbai has an electric pulse that keeps you motivated no matter how grueling the week was. #mumbai #citylife #travel',
    image: '/assets/images/seed/mumbai_sea_link.jpg',
    createdAt: hoursAgo(6),
  },
  // 5. Tech text-only
  {
    authorUsername: 'priyasharma',
    text: 'Vanilla CSS has officially replaced 90% of what we used to reach for component libraries to do. Subgrid, container queries, CSS variables, View Transitions, and color-mix(). It is an incredible time to build for the web.',
    createdAt: hoursAgo(7),
  },
  // 6. Food - Filter Coffee
  {
    authorUsername: 'ananyaiyer',
    text: 'Hot brass tumbler of authentic degree filter coffee to start Saturday. The aroma alone is therapeutic. South India knows how to brew perfection. ☕ #foodie #coffee #chennai',
    image: '/assets/images/seed/coffee_latte_art.jpg',
    createdAt: hoursAgo(9),
  },
  // 7. Cricket
  {
    authorUsername: 'rohit_cricket',
    text: 'Full house at Wankhede! That final over thriller had 33,000 people screaming in unison. T20 cricket under lights in Mumbai is unmatched magic. #cricket #ipl #wankhede',
    image: '/assets/images/seed/cricket_stadium.jpg',
    createdAt: hoursAgo(11),
  },
  // 8. Photography
  {
    authorUsername: 'meera_kapoor',
    text: 'Packed my favorite 35mm prime and headed into the narrow lanes of Old Delhi. The textures, candid portraits, and afternoon light here are a storyteller’s dream. #photography #streetphotography #delhi',
    image: '/assets/images/seed/photography_camera.jpg',
    createdAt: hoursAgo(13),
  },
  // 9. Startup text-only
  {
    authorUsername: 'vikram_singh',
    text: 'Best advice for early founders: talk to 5 real customers every single day. Not surveys, not analytics dashboards. Real human conversations. They will tell you exactly what you are doing wrong in 2 minutes.',
    createdAt: hoursAgo(15),
  },
  // 10. Travel - Himalayas
  {
    authorUsername: 'meera_kapoor',
    text: 'First light hitting the snow peaks in Spiti Valley. Zero mobile network, crisp -4°C air, and complete silence. Moments like this remind you how vast and beautiful the world is. #travel #himalayas #wanderlust',
    image: '/assets/images/seed/himalayas_travel.jpg',
    createdAt: hoursAgo(18),
  },
  // 11. Student / Hackathon
  {
    authorUsername: 'karan_mehta',
    text: 'Hour 28 of our 36-hour hackathon. Empty Red Bull cans, whiteboard architecture diagrams, and a compiler that finally gave zero errors. Demo presentation in two hours! 🚀 #student #hackathon #coding',
    image: '/assets/images/seed/student_hackathon.jpg',
    createdAt: hoursAgo(21),
  },
  // 12. Food - Street Chaat
  {
    authorUsername: 'poojareddy',
    text: 'Crispy sev puri and pani puri that explodes with mint and tamarind water! Delhi and Mumbai street food culture is truly second to none. #foodie #streetfood #chaat',
    image: '/assets/images/seed/street_food_chaat.jpg',
    createdAt: hoursAgo(23),
  },
  // 13. Running
  {
    authorUsername: 'tara_fitness',
    text: '12km morning trail run along the ridge. Cool breeze, sunrise through the trees, and fresh lungs. Start your morning with movement. #fitness #running #morningroutine',
    image: '/assets/images/seed/runner_morning.jpg',
    createdAt: daysAgo(1, 1),
  },
  // 14. Architecture / Heritage
  {
    authorUsername: 'devika_arch',
    text: 'The geometric symmetry of Chand Baori stepwell in Abhaneri. Built over 1,200 years ago, it remains an engineering and architectural marvel of rainwater harvesting. #design #architecture #heritage',
    image: '/assets/images/seed/delhi_monument.jpg',
    createdAt: daysAgo(1, 3),
  },
  // 15. Dev Tooling text-only
  {
    authorUsername: 'kabirdas',
    text: 'A clean developer experience is not about adding more configuration flags. It is about making the most common path completely effortless. Software should be intuitive.',
    createdAt: daysAgo(1, 5),
  },
  // 16. Remote work terrace
  {
    authorUsername: 'arjun_tech',
    text: 'Working from the rooftop in Bengaluru today. Mild breeze, shade under the palms, and debugging microservices with a hot cup of chai. Remote work done right. #startups #remotework #tech',
    image: '/assets/images/seed/remote_work_terrace.jpg',
    createdAt: daysAgo(1, 7),
  },
  // 17. Food - Hyderabadi Dum Biryani
  {
    authorUsername: 'poojareddy',
    text: 'The legendary Hyderabadi dum biryani cooked in sealed handis over slow charcoal. Fragrant long-grain basmati, saffron, and tender spices. Heaven on a plate. #foodie #biryani #hyderabad',
    image: '/assets/images/seed/biryani_food.jpg',
    createdAt: daysAgo(1, 9),
  },
  // 18. Cricket gear
  {
    authorUsername: 'rohit_cricket',
    text: 'Freshly oiled English willow bat ready for Saturday league match. That sweet spot sound when you nail a cover drive is the most satisfying feeling in sports. #cricket #sports #weekend',
    image: '/assets/images/seed/cricket_bat.jpg',
    createdAt: daysAgo(1, 11),
  },
  // 19. Hardware Keyboard
  {
    authorUsername: 'demo',
    text: 'Custom mechanical keyboard build complete! Lubricated linear switches, brass plate, and PBT keycaps. Typing feels like bubble wrap. ⌨️ #tech #setup #keyboards',
    image: '/assets/images/seed/mechanical_keyboard.jpg',
    createdAt: daysAgo(1, 14),
  },
  // 20. Code text-only
  {
    authorUsername: 'arjun_tech',
    text: 'The simplest architecture that solves the problem is usually the best one. You don’t need Kafka for a workload with 10 requests per minute. Start boring, optimize when metrics demand it.',
    createdAt: daysAgo(1, 16),
  },
  // 21. Travel - Kerala
  {
    authorUsername: 'meera_kapoor',
    text: 'Gliding along the backwaters of Alleppey in a traditional wooden houseboat. Endless coconut groves, water lilies, and the sound of ripples. God’s Own Country never ceases to mesmerize. #travel #kerala #backwaters',
    image: '/assets/images/seed/kerala_backwaters.jpg',
    createdAt: daysAgo(2, 2),
  },
  // 22. Design sketchbook
  {
    authorUsername: 'sneha_patel',
    text: 'Before Figma, always pencil and paper. Sketching rough layout concepts, user flows, and card hierarchies. The tactile speed of sketching unlocks ideas you would never think of in pixels. #design #ux #wireframing',
    image: '/assets/images/seed/design_sketchbook.jpg',
    createdAt: daysAgo(2, 4),
  },
  // 23. Craft - Pottery
  {
    authorUsername: 'devika_arch',
    text: 'Spent the afternoon at a local pottery workshop learning wheel throwing. Getting your hands muddy and feeling the clay center into shape is the ultimate antidote to screen fatigue. #pottery #craft #mindfulness',
    image: '/assets/images/seed/pottery_craft.jpg',
    createdAt: daysAgo(2, 6),
  },
  // 24. Night sky
  {
    authorUsername: 'meera_kapoor',
    text: 'Milky Way core rising above the mountain ridgeline. Long exposure capture at 3,200 meters. When light pollution disappears, the universe reveals its true grandeur. ✨ #photography #astrophotography #nightsky',
    image: '/assets/images/seed/night_sky_stars.jpg',
    createdAt: daysAgo(2, 8),
  },
  // 25. Food - Dosa breakfast
  {
    authorUsername: 'ananyaiyer',
    text: 'Paper-thin crispy ghee roast masala dosa with fresh coconut chutney and piping hot sambar. The undisputed champion of Indian breakfasts. 🥞 #foodie #breakfast #chennai',
    image: '/assets/images/seed/dosa_breakfast.jpg',
    createdAt: daysAgo(2, 10),
  },
  // 26. Startup office
  {
    authorUsername: 'vikram_singh',
    text: 'Moved into our new office space in Koramangala today! 3 years ago we started with two desks in a garage. Immensely proud of this team and the mission we are building. #startups #bengaluru #growth',
    image: '/assets/images/seed/startup_office.jpg',
    createdAt: daysAgo(2, 12),
  },
  // 27. Chai street
  {
    authorUsername: 'demo',
    text: 'Hot ginger cardamom cutting chai served in a kulhad on a rainy Mumbai afternoon. Pure warmth and bliss in a cup. ☕ #chai #mumbai #monsoon',
    image: '/assets/images/seed/chai_street.jpg',
    createdAt: daysAgo(2, 15),
  },
  // 28. College campus
  {
    authorUsername: 'karan_mehta',
    text: 'Walk across the campus between lectures. Gulmohar trees in full bloom and students debating everything from neural networks to quantum computing. Campus life is irreplaceable. #student #college #campus',
    image: '/assets/images/seed/college_campus.jpg',
    createdAt: daysAgo(3, 2),
  },
  // 29. Bangalore skyline
  {
    authorUsername: 'arjun_tech',
    text: 'Dusk over the Bengaluru tech parks. The weather in this city is undefeated &mdash; 22°C year-round with a gentle evening breeze. India’s Silicon Valley keeps buzzing. #bengaluru #tech #cityscape',
    image: '/assets/images/seed/bangalore_skyline.jpg',
    createdAt: daysAgo(3, 4),
  },
  // 30. Goa beach
  {
    authorUsername: 'sneha_patel',
    text: 'Weekend workation in South Goa. Laptop closed at 5 PM, barefoot on the sand, watching the sun dip into the Arabian Sea. Balance is non-negotiable. 🌊 #travel #goa #workation',
    image: '/assets/images/seed/goa_beach.jpg',
    createdAt: daysAgo(3, 7),
  },
  // 31. Monsoon rain
  {
    authorUsername: 'demo',
    text: 'First heavy monsoon shower of the season hitting the window panes. The petrichor scent in the air is magical. Hot bhajiyas and chai time! 🌧️ #monsoon #rain #nature',
    image: '/assets/images/seed/monsoon_rain.jpg',
    createdAt: daysAgo(3, 10),
  },
  // 32. Festival diya
  {
    authorUsername: 'devika_arch',
    text: 'Earthen oil lamps glowing in courtyard verandas. Celebrating traditions of light, warmth, and togetherness with family. #festival #tradition #india',
    image: '/assets/images/seed/festival_diya.jpg',
    createdAt: daysAgo(3, 14),
  },
  // 33. Tech code
  {
    authorUsername: 'demo',
    text: 'Refactoring 2,000 lines of legacy spaghetti into elegant, modular ES modules with clean separation of concerns. Nothing feels quite as good as deleting unused code. #webdev #cleancode #javascript',
    image: '/assets/images/seed/tech_code.jpg',
    createdAt: daysAgo(3, 16),
  },
  // 34. Laptop coffee
  {
    authorUsername: 'priyasharma',
    text: 'Deep work afternoon at the cafe. Designing an intuitive multi-reaction interaction model. Great UI should feel invisible &mdash; people should just know how to use it instinctively. #design #ui #creativity',
    image: '/assets/images/seed/laptop_coffee.jpg',
    createdAt: daysAgo(4, 2),
  },
  // 35-60: Rich text posts across topics
  {
    authorUsername: 'kabirdas',
    text: 'The best engineering teams don’t measure output by lines of code written. They measure by problems prevented, latency reduced, and simplicity preserved.',
    createdAt: daysAgo(4, 4),
  },
  {
    authorUsername: 'tara_fitness',
    text: 'Hydration tip: drink a large glass of water with a pinch of rock salt and lemon first thing in the morning. Better energy than double espresso.',
    createdAt: daysAgo(4, 6),
  },
  {
    authorUsername: 'rohit_cricket',
    text: 'Jasprit Bumrah bowling in the death overs is art. The seam presentation, disguise in the slower ball, and inch-perfect yorkers. Truly once in a generation bowler.',
    createdAt: daysAgo(4, 8),
  },
  {
    authorUsername: 'aman_music',
    text: 'Music production is 20% inspiration and 80% EQ tweaking and automation envelopes. When the mix finally gels and breathes, all those late nights make sense.',
    createdAt: daysAgo(4, 11),
  },
  {
    authorUsername: 'poojareddy',
    text: 'Authentic Andhra rasam requires hand-crushed black peppercorns, garlic, cumin, and tamarind. If it doesn’t clear your sinuses in two sips, it’s not spicy enough! 🌶️',
    createdAt: daysAgo(4, 14),
  },
  {
    authorUsername: 'ananyaiyer',
    text: 'Small language models running locally on personal devices are going to transform privacy and personalization over the next 24 months. Fast, private, offline-first.',
    createdAt: daysAgo(5, 1),
  },
  {
    authorUsername: 'karan_mehta',
    text: 'Pro tip for CS students: contribute to at least one open-source repo before graduating. Reading large, real-world codebases teaches you more than any classroom textbook.',
    createdAt: daysAgo(5, 3),
  },
  {
    authorUsername: 'vikram_singh',
    text: 'India’s digital public infrastructure (UPI, ONDC, DigiLocker) is a masterclass in technology democratizing commerce for 1.4 billion people.',
    createdAt: daysAgo(5, 6),
  },
  {
    authorUsername: 'sneha_patel',
    text: 'User research rule: don’t ask people what features they want. Observe what frustrates them in their current workflow and design the relief.',
    createdAt: daysAgo(5, 9),
  },
  {
    authorUsername: 'arjun_tech',
    text: 'PostgreSQL JSONB + indexing gives you 95% of MongoDB’s document flexibility with 100% of ACID guarantees. Learn your database engine deeply.',
    createdAt: daysAgo(5, 12),
  },
  {
    authorUsername: 'devika_arch',
    text: 'Ancient Indian homes had central courtyards for natural passive cooling and ventilation. We need to integrate these time-tested vernacular principles into modern urban architecture.',
    createdAt: daysAgo(5, 15),
  },
  {
    authorUsername: 'demo',
    text: 'Shipped a brand new reaction engine with spring physics and zero external libraries. Keeping bundle sizes tiny is an act of respect for users’ devices.',
    createdAt: daysAgo(5, 18),
  },
  {
    authorUsername: 'meera_kapoor',
    text: 'Golden hour is great, but blue hour &mdash; the 20 minutes right after sunset &mdash; is when cities look the most cinematic. The ambient sky matches the warm tungsten city lights.',
    createdAt: daysAgo(6, 2),
  },
  {
    authorUsername: 'tara_fitness',
    text: 'You don’t need an expensive gym membership to build strength. Pull-ups, push-ups, dips, and sprints will take you further than 90% of machines.',
    createdAt: daysAgo(6, 4),
  },
  {
    authorUsername: 'kabirdas',
    text: 'Code reviews are not tests of technical dominance. They are collaborative opportunities to level up the entire team and ensure shared ownership.',
    createdAt: daysAgo(6, 7),
  },
  {
    authorUsername: 'priyasharma',
    text: 'Dark mode is not just inverted colors. You have to tailor luminance contrast, reduce pure white text to soft paper tones, and use subtle tinted glows instead of harsh borders.',
    createdAt: daysAgo(6, 10),
  },
  {
    authorUsername: 'rohit_cricket',
    text: 'Test cricket on day 5 with 3 wickets needed in the final session is the pinnacle of sporting drama. No format compares to the endurance of red-ball cricket.',
    createdAt: daysAgo(6, 13),
  },
  {
    authorUsername: 'poojareddy',
    text: 'Best sweet in India? Mysurpa from Coimbatore or warm gulab jamuns in Amritsar? The debate in our house is getting heated!',
    createdAt: daysAgo(6, 16),
  },
  {
    authorUsername: 'aman_music',
    text: 'Listening to classical Indian ragas on vinyl through tube amplifiers. The nuances of the sitar and sarod resonance are pure meditation.',
    createdAt: daysAgo(6, 19),
  },
  {
    authorUsername: 'karan_mehta',
    text: 'Just solved a thorny concurrency race condition in our distributed cache with a simple compare-and-swap loop. Dopamine hit of the week!',
    createdAt: daysAgo(6, 21),
  },
  {
    authorUsername: 'vikram_singh',
    text: 'Hire for curiosity and resilience above raw credentials. People who figure things out when there is no playbook are the ones who build enduring companies.',
    createdAt: daysAgo(6, 23),
  },
  {
    authorUsername: 'demo',
    text: 'Sangam is all about bringing people together around authentic ideas, stories, and creativity. Welcome to our community! #sangam #welcome',
    createdAt: daysAgo(7, 1),
  },
];

// Seed stories for 8-10 users
const storiesData = [
  {
    authorUsername: 'demo',
    text: 'Late night coding session on the new stories and reactions engine! ☕✨',
    backgroundColor: 'linear-gradient(135deg, #FF007A 0%, #FF5A36 50%, #FFA41B 100%)',
  },
  {
    authorUsername: 'priyasharma',
    text: 'Testing the new spring animations on iPhone Safari. 60fps buttery smooth! 📱🎨',
    backgroundColor: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
  },
  {
    authorUsername: 'ananyaiyer',
    text: 'Degree filter coffee number 3 today. Big breakthroughs in model quantization! 💡',
    backgroundColor: 'linear-gradient(135deg, #0E7C86 0%, #FFA41B 100%)',
  },
  {
    authorUsername: 'rohit_cricket',
    text: 'Pitch inspection at Wankhede. Looks like a batsman’s paradise today! 🏏🔥',
    backgroundColor: 'linear-gradient(135deg, #0070F3 0%, #00DFD8 100%)',
  },
  {
    authorUsername: 'tara_fitness',
    text: 'Sunrise 10k completed in 46 minutes! Never skip Monday movement. 🏃‍♀️🌅',
    backgroundColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  },
  {
    authorUsername: 'meera_kapoor',
    text: 'Shooting the evening Aarti along the Ghats. Pure spiritual energy. 📸✨',
    backgroundColor: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  },
  {
    authorUsername: 'poojareddy',
    text: 'Slow-cooking handi biryani for the family feast tonight! 🍲🌶️',
    backgroundColor: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },
  {
    authorUsername: 'aman_music',
    text: 'Testing acoustic resonance in the new sound booth. Sounds crisp! 🎸🎵',
    backgroundColor: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  },
  {
    authorUsername: 'karan_mehta',
    text: 'Hackathon countdown: 2 hours left! Pushing code to main. 💻⚡',
    backgroundColor: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    console.log('Clearing existing platform data...');
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Notification.deleteMany({}),
      Story.deleteMany({}),
    ]);

    console.log(`Creating ${usersData.length} users...`);
    const createdUsers = [];
    for (const u of usersData) {
      const user = await User.create({
        name: u.name,
        username: u.username,
        email: u.email,
        password: DEMO_PASSWORD,
        bio: u.bio,
        avatarHue: u.avatarHue,
        bannerPreset: u.bannerPreset,
      });
      createdUsers.push(user);
    }

    const userMap = new Map();
    createdUsers.forEach(u => userMap.set(u.username, u));

    console.log('Setting up follower networks...');
    const demoUser = userMap.get('demo');
    // Connect demo user with realistic follower network
    for (let i = 1; i < createdUsers.length; i++) {
      const targetUser = createdUsers[i];
      // Mutual follows for first 8 users
      if (i <= 8) {
        demoUser.following.push(targetUser._id);
        targetUser.followers.push(demoUser._id);
      }
      demoUser.followers.push(targetUser._id);
      targetUser.following.push(demoUser._id);

      // Random follows between other users
      for (let j = 1; j < 5; j++) {
        const randIndex = (i + j) % createdUsers.length;
        if (randIndex !== i && randIndex !== 0) {
          const friend = createdUsers[randIndex];
          if (!targetUser.following.includes(friend._id)) {
            targetUser.following.push(friend._id);
            friend.followers.push(targetUser._id);
          }
        }
      }
    }

    // Save user network counts
    for (const u of createdUsers) {
      u.followersCount = u.followers.length;
      u.followingCount = u.following.length;
      await u.save();
    }

    console.log(`Seeding ${postsData.length} posts with reactions and comments...`);
    const createdPosts = [];
    const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad'];

    for (let i = 0; i < postsData.length; i++) {
      const p = postsData[i];
      const author = userMap.get(p.authorUsername) || createdUsers[i % createdUsers.length];

      // Extract hashtags
      const hashtags = (p.text.match(/#[a-z0-9_]+/gi) || []).map(h => h.replace('#', '').toLowerCase());

      // Pick realistic likers
      const likerCount = 3 + (i * 3) % 9;
      const reactions = [];
      const likes = [];

      for (let j = 0; j < likerCount; j++) {
        const liker = createdUsers[(i + j + 1) % createdUsers.length];
        const rType = reactionTypes[(i + j) % reactionTypes.length];
        reactions.push({ user: liker._id, type: rType, createdAt: p.createdAt });
        likes.push(liker._id);
      }

      const post = await Post.create({
        author: author._id,
        text: p.text,
        image: p.image || null,
        hashtags,
        mentions: [],
        likes,
        likesCount: likes.length,
        reactions,
        commentsCount: 0,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      });

      author.postsCount = (author.postsCount || 0) + 1;
      createdPosts.push(post);
    }

    // Save author post counts
    for (const u of createdUsers) {
      await u.save();
    }

    console.log('Seeding comments on posts...');
    const commentsList = [
      'This is absolutely spot on! Couldn’t agree more.',
      'Brilliant perspective. Thanks for sharing this!',
      'Incredible capture! The lighting is so serene.',
      'Bookmarking this insight for the team.',
      'So inspiring! Keep building and sharing.',
      'Where was this taken? The atmosphere looks magical.',
      'Completely changed how I think about this problem.',
      'The attention to detail here is next level. 👏',
    ];

    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      if (i % 2 === 0) {
        const commenter = createdUsers[(i + 2) % createdUsers.length];
        const commentText = commentsList[i % commentsList.length];

        await Comment.create({
          post: post._id,
          author: commenter._id,
          text: commentText,
          createdAt: new Date(post.createdAt.getTime() + 15 * 60 * 1000),
        });

        post.commentsCount = (post.commentsCount || 0) + 1;
        await post.save();
      }
    }

    console.log('Seeding active 24h stories for creators...');
    for (const s of storiesData) {
      const author = userMap.get(s.authorUsername);
      if (author) {
        await Story.create({
          author: author._id,
          text: s.text,
          backgroundColor: s.backgroundColor,
          viewers: [demoUser._id],
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        });
      }
    }

    console.log('Seeding demo notifications...');
    const notifSample = createdPosts.slice(0, 10);
    for (let i = 0; i < notifSample.length; i++) {
      const post = notifSample[i];
      const actor = createdUsers[(i + 1) % createdUsers.length];
      await Notification.create({
        recipient: demoUser._id,
        actor: actor._id,
        type: i % 3 === 0 ? 'like' : (i % 3 === 1 ? 'comment' : 'follow'),
        post: i % 3 !== 2 ? post._id : null,
        read: i > 3,
        createdAt: hoursAgo(i * 2 + 1),
      });
    }

    console.log('Seeding completed successfully!');
    console.log(`Summary:
- Users created: ${createdUsers.length}
- Posts created: ${createdPosts.length} (30 with photos)
- Active stories: ${storiesData.length}
- Demo credentials: demo@sangam.in / ${DEMO_PASSWORD}
    `);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDatabase();
