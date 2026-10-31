const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Media = require('../models/Media');

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
    bio: 'Full Stack Engineer @CodeAlpha. Building Sangam. Love clean code, distributed systems, and hot cutting chai.',
    avatarHue: 215,
    bannerPreset: 0,
  },
  {
    name: 'Priya Sharma',
    username: 'priyasharma',
    email: 'priya@sangam.in',
    bio: 'Design engineer & CSS fanatic. Exploring View Transitions, fluid typography, and micro-interactions.',
    avatarHue: 330,
    bannerPreset: 1,
  },
  {
    name: 'Arjun Nair',
    username: 'arjun_tech',
    email: 'arjun@sangam.in',
    bio: 'Backend architect & Go/Node hacker. Living between Bengaluru Outer Ring Road and Vimana cafe.',
    avatarHue: 160,
    bannerPreset: 2,
  },
  {
    name: 'Ananya Iyer',
    username: 'ananyaiyer',
    email: 'ananya@sangam.in',
    bio: 'AI researcher working on edge models. Filter coffee addict in Chennai. Reading sci-fi.',
    avatarHue: 280,
    bannerPreset: 3,
  },
  {
    name: 'Rohit Malhotra',
    username: 'rohit_cricket',
    email: 'rohit@sangam.in',
    bio: 'Cricket analyst, weekend club cricketer & stats nerd. Bleeding blue at Wankhede.',
    avatarHue: 38,
    bannerPreset: 4,
  },
  {
    name: 'Sneha Patel',
    username: 'sneha_patel',
    email: 'sneha@sangam.in',
    bio: 'Product Designer at a fintech unicorn. Crafting delightful user journeys without friction.',
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
    bio: 'Culinary explorer & food writer in Hyderabad. Looking for the best dum biryani in town.',
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
    bio: 'Photographer traveling through Spiti, Ladakh, and the Konkan coast. Capturing Indian stories.',
    avatarHue: 175,
    bannerPreset: 2,
  },
  {
    name: 'Tanmay Deshmukh',
    username: 'tanmay_dev',
    email: 'tanmay@sangam.in',
    bio: 'DevOps & Cloud platform engineer. Kubernetes, Terraform, and zero-downtime deploys.',
    avatarHue: 205,
    bannerPreset: 3,
  },
  {
    name: 'Divya Joshi',
    username: 'divya_joshi',
    email: 'divya@sangam.in',
    bio: 'Community builder & host of the Tech Sangam podcast. Championing women in tech.',
    avatarHue: 300,
    bannerPreset: 0,
  },
];

const postsData = [
  {
    user: 'demo',
    text: 'Welcome to Sangam! We built this platform from scratch with Vanilla HTML, modern CSS and Node.js. No bloated frameworks, just pure speed and craft. What do you think? #buildinpublic #sangam #webdev',
    image: '/assets/images/seed/tech_code.jpg',
    daysAgo: 0.1,
  },
  {
    user: 'priyasharma',
    text: 'Nothing beats a steaming glass of cutting chai at 7 AM before opening VS Code. How many cups of tea or coffee does your codebase consume daily? ☕ #chai #morningroutine #bangalore',
    image: '/assets/images/seed/chai_street.jpg',
    daysAgo: 0.2,
  },
  {
    user: 'rohit_cricket',
    text: 'The roar of 40,000 fans under the floodlights at the stadium is pure electricity. Cricket is not just a sport in India, it is an emotion! Who is watching the match tonight? #cricket #india #matchday',
    image: '/assets/images/seed/cricket_stadium.jpg',
    daysAgo: 0.4,
  },
  {
    user: 'arjun_tech',
    text: 'Silhouetted towers along Outer Ring Road. Bangalore will test your patience in traffic, but the energy of builders here is unmatched anywhere in the world. #bangalore #techlife #startups',
    image: '/assets/images/seed/bangalore_skyline.jpg',
    daysAgo: 0.6,
  },
  {
    user: 'poojareddy',
    text: 'Golden, crispy Mysore Masala Dosa with fresh coconut chutney and piping hot sambar. Sunday breakfast ritual sorted! 🤤 #foodie #southindian #breakfast #foodlovers',
    image: '/assets/images/seed/dosa_breakfast.jpg',
    daysAgo: 0.8,
  },
  {
    user: 'meera_kapoor',
    text: 'Woke up at 14,000 feet surrounded by the raw majesty of the Himalayas. Clean air, quiet trails, and mountains that remind you how small we really are. #travel #himalayas #wanderlust #nature',
    image: '/assets/images/seed/himalayas_travel.jpg',
    daysAgo: 1.1,
  },
  {
    user: 'vikram_singh',
    text: 'Whiteboarding our Q4 roadmap with the founding engineering team. 0 to 1 is intense, messy, and the most rewarding thing you can do. Always be shipping! #startups #leadership #founders',
    image: '/assets/images/seed/startup_office.jpg',
    daysAgo: 1.3,
  },
  {
    user: 'ananyaiyer',
    text: 'Training 7B parameter reasoning models on local hardware with quantization is getting shockingly good. The edge AI revolution is arriving faster than anticipated. #ai #machinelearning #tech',
    image: '/assets/images/seed/ai_chip.jpg',
    daysAgo: 1.5,
  },
  {
    user: 'divya_joshi',
    text: 'Driving past the Bandra-Worli Sea Link at golden hour. Mumbai has this unstoppable pulse that pushes you to dream bigger every single day. #mumbai #cityofdreams #goldenhour',
    image: '/assets/images/seed/mumbai_sea_link.jpg',
    daysAgo: 1.8,
  },
  {
    user: 'poojareddy',
    text: 'After testing 14 different spots across Old City, I can officially confirm: authentic dum pukht biryani with mirchi ka salan is unbeatable. Food paradise! #hyderabad #biryani #foodie',
    image: '/assets/images/seed/biryani_food.jpg',
    daysAgo: 2.1,
  },
  {
    user: 'karan_mehta',
    text: 'Post-lecture jam session under the campus trees with the robotics club. 48 hours to the annual inter-college hackathon. Sleep is optional! #college #hackathon #iitbombay #studentlife',
    image: '/assets/images/seed/college_campus.jpg',
    daysAgo: 2.3,
  },
  {
    user: 'sneha_patel',
    text: 'Watching the first monsoon showers hit the window pane with lo-fi beats in the background. Peak productivity aesthetic unlocked. 🌧️ #monsoon #aesthetic #vibes',
    image: '/assets/images/seed/monsoon_rain.jpg',
    daysAgo: 2.7,
  },
  {
    user: 'meera_kapoor',
    text: 'Sun sinking into the Arabian Sea at South Goa. Soft sand, palm trees swaying, and zero notifications for the next 48 hours. Pure bliss. #goa #beachlife #sunset #travel',
    image: '/assets/images/seed/goa_beach.jpg',
    daysAgo: 3.1,
  },
  {
    user: 'divya_joshi',
    text: 'Lighting diyas with family this evening. May warmth, happiness, and prosperity illuminate everyone’s journey. Wishing all of you endless joy! #festival #diwali #celebration #tradition',
    image: '/assets/images/seed/festival_diya.jpg',
    daysAgo: 3.4,
  },
  {
    user: 'tanmay_dev',
    text: 'Quiet coffee shop corner, cold brew in hand, writing Terraform modules that provision entire multi-region clusters in 4 minutes. Love infrastructure as code. #devops #cloud #coffee',
    image: '/assets/images/seed/laptop_coffee.jpg',
    daysAgo: 3.8,
  },
  // Text-only posts & additional discussions
  {
    user: 'demo',
    text: 'Pro tip for clean architecture: keep your data models lean, decouple your business rules from the HTTP transport layer, and never skip centralized error handling. #webdev #cleancode',
    image: null,
    daysAgo: 4.0,
  },
  {
    user: 'priyasharma',
    text: 'CSS View Transitions API has completely changed how smooth multi-page apps feel. You don’t need 500KB of client JS just to animate between screens! #css #webperformance #ux',
    image: null,
    daysAgo: 4.2,
  },
  {
    user: 'arjun_tech',
    text: 'Why do so many startups over-engineer microservices when a well-structured modular monolith can easily handle 10,000 requests per second on a single $40 instance? #systemdesign #architecture',
    image: null,
    daysAgo: 4.5,
  },
  {
    user: 'ananyaiyer',
    text: 'Shoutout to @demo for the amazing work on Sangam’s frontend design. The micro-animations and typography scale look incredible on retina displays! #kudos #ui #ux',
    image: null,
    daysAgo: 4.7,
  },
  {
    user: 'rohit_cricket',
    text: 'Test cricket in the sub-continent will always test your temperament. The turn on day 4 is poetry in slow motion. Spin bowling is an art form. #cricket #testcricket #sports',
    image: null,
    daysAgo: 5.0,
  },
  {
    user: 'sneha_patel',
    text: 'Design rule #1: Good design is obvious. Great design is transparent. If the user has to stop and think about where to click next, the layout failed. #productdesign #uxdesign',
    image: null,
    daysAgo: 5.2,
  },
  {
    user: 'vikram_singh',
    text: 'The best founders I’ve backed aren’t the ones with the most polished pitch decks. They are the ones who understand their customer’s pain point at a visceral, molecular level. #startups #venturecapital',
    image: null,
    daysAgo: 5.4,
  },
  {
    user: 'karan_mehta',
    text: 'Finally finished implementing an LRU cache with O(1) get and put in C++. Feels great when theoretical data structures solve real memory bottleneck challenges! #datastructures #algorithms #coding',
    image: null,
    daysAgo: 5.6,
  },
  {
    user: 'tanmay_dev',
    text: 'Remember: Backups are meaningless until you have successfully executed and validated an automated recovery drill. Test your restore procedures! #sysadmin #devops #reliability',
    image: null,
    daysAgo: 5.8,
  },
  {
    user: 'divya_joshi',
    text: 'Just wrapped episode #18 of Tech Sangam discussing early career roadmaps in tech. Key takeaway: build publicly, document your learnings, and help others on the way up. #career #mentorship',
    image: null,
    daysAgo: 6.0,
  },
  {
    user: 'demo',
    text: 'Shoutout to @priyasharma and @arjun_tech for the feedback on our indexing strategy. Compound indexes on createdAt and hashtags shaved response times down to single-digit ms! #mongodb #database #perf',
    image: null,
    daysAgo: 6.2,
  },
  {
    user: 'priyasharma',
    text: 'Friendly reminder: accessibility is not an afterthought or a compliance checkbox. High contrast tokens, keyboard navigability, and semantic HTML make the web better for everyone. #a11y #webdev',
    image: null,
    daysAgo: 6.3,
  },
  {
    user: 'arjun_tech',
    text: 'Database connection pooling tip: don’t set your pool size to 100 just because you have 100 CPU threads. 10 to 20 connections is often optimal and avoids thread thrashing. #database #backend',
    image: null,
    daysAgo: 6.5,
  },
  {
    user: 'ananyaiyer',
    text: 'Reading papers on retrieval augmented generation (RAG). The quality of your embeddings and chunking strategy matters 10x more than which LLM you invoke for inference. #ai #datascience',
    image: null,
    daysAgo: 6.7,
  },
  {
    user: 'sneha_patel',
    text: 'Dark mode isn’t just #000000 with white text. It requires elevation layers, muted borders, and desaturated accent colors so the eyes don’t fatigue at night. #designsystem #darkmode',
    image: null,
    daysAgo: 6.9,
  },
  {
    user: 'vikram_singh',
    text: 'India’s DPI stack (UPI, ONDC, DigiLocker) is genuinely a masterclass in population-scale systems engineering. Excited for what the next generation builds on top of it. #fintech #digitalindia #engineering',
    image: null,
    daysAgo: 0.3,
  },
  {
    user: 'poojareddy',
    text: 'The secret to authentic Chettinad pepper chicken is dry roasting stone-ground spices just until aromatic. Never rush the masala base! #foodie #indiancuisine #cooking',
    image: null,
    daysAgo: 1.2,
  },
  {
    user: 'meera_kapoor',
    text: 'Golden light hitting the stepwells of Rajasthan at sunrise. India’s historic hydrology architecture is as breathtaking as any modern sculpture. #heritage #photography #architecture #travel',
    image: '/assets/images/seed/mumbai_sea_link.jpg',
    daysAgo: 1.6,
  },
  {
    user: 'karan_mehta',
    text: 'Our college team just qualified for the ACM ICPC regionals! Months of solving graph theory and DP problems on weekend nights finally paying off. Keep grinding! #icpc #coding #algorithms',
    image: null,
    daysAgo: 2.5,
  },
  {
    user: 'rohit_cricket',
    text: 'Gully cricket rules that defined our childhood: 1. One tip one hand out. 2. Lost ball means the batsman buys a new one. 3. Direct hit to uncle’s car is out. Who remembers? 😄 #cricket #childhood #memories',
    image: null,
    daysAgo: 3.5,
  },
  {
    user: 'divya_joshi',
    text: 'Mentoring 5 first-generation college coders this semester. Watching their eyes light up when their first pull request gets merged is the most rewarding feeling in the world. #mentorship #techcommunity',
    image: null,
    daysAgo: 4.8,
  },
  {
    user: 'tanmay_dev',
    text: 'PSA: Immutable infrastructure doesn’t mean never changing things; it means creating new versioned artifacts rather than mutating live production instances. Sleep peaceful at night. #devops #cloud',
    image: null,
    daysAgo: 5.5,
  },
  {
    user: 'demo',
    text: 'The beauty of clean vanilla web technologies: zero compilation step, zero npm security audit alerts in your client bundle, and loads in less than 80ms worldwide. Pure craft. #webdev #performance',
    image: null,
    daysAgo: 0.5,
  },
  {
    user: 'priyasharma',
    text: 'Paper and ink aesthetics with River Teal and Marigold accents. Digital products can feel tactile, organic and human if you treat typography and whitespace with love. #design #typography #craft',
    image: null,
    daysAgo: 0.7,
  },
  {
    user: 'arjun_tech',
    text: 'Early morning coffee thoughts: The best code is the code you didn’t have to write because you solved the problem at the domain model level. Simplicity is the ultimate sophistication. #cleancode #philosophy',
    image: null,
    daysAgo: 1.9,
  },
];


async function seed() {
  console.log('Connecting to database for seeding...');
  await connectDB();

  console.log('Clearing existing platform data...');
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    Media.deleteMany({}),
  ]);

  console.log('Creating demo users...');
  const userMap = {};

  for (const u of usersData) {
    const user = await User.create({
      name: u.name,
      username: u.username,
      email: u.email,
      password: DEMO_PASSWORD,
      bio: u.bio,
      avatarHue: u.avatarHue,
      bannerPreset: u.bannerPreset,
      followers: [],
      following: [],
      bookmarks: [],
    });
    userMap[u.username] = user;
  }

  const demoUser = userMap['demo'];
  const otherUsers = Object.values(userMap).filter(u => u.username !== 'demo');

  console.log('Setting up follower networks...');
  // Demo follows 8 active users
  const demoFollowTargets = ['priyasharma', 'arjun_tech', 'ananyaiyer', 'sneha_patel', 'rohit_cricket', 'vikram_singh', 'poojareddy', 'meera_kapoor'];
  for (const targetName of demoFollowTargets) {
    const target = userMap[targetName];
    if (target) {
      demoUser.following.push(target._id);
      target.followers.push(demoUser._id);
    }
  }

  // Cross-follows among other users
  for (let i = 0; i < otherUsers.length; i++) {
    const u1 = otherUsers[i];
    // Follow demo back for some
    if (i % 2 === 0) {
      u1.following.push(demoUser._id);
      demoUser.followers.push(u1._id);
    }
    // Follow adjacent users
    const next1 = otherUsers[(i + 1) % otherUsers.length];
    const next2 = otherUsers[(i + 3) % otherUsers.length];
    u1.following.push(next1._id);
    next1.followers.push(u1._id);
    u1.following.push(next2._id);
    next2.followers.push(u1._id);
  }

  // Save all updated user follow arrays
  await Promise.all(Object.values(userMap).map(u => u.save()));

  console.log('Seeding posts across past 7 days...');
  const createdPosts = [];

  for (const p of postsData) {
    const author = userMap[p.user] || demoUser;
    const createdAt = new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000);

    // Extract hashtags and mentions
    const hashtagMatches = p.text.match(/#([a-zA-Z0-9_]+)/g);
    const hashtags = hashtagMatches ? [...new Set(hashtagMatches.map(t => t.slice(1).toLowerCase()))] : [];

    const mentionMatches = p.text.match(/@([a-zA-Z0-9_]{3,20})/g);
    const mentions = mentionMatches ? [...new Set(mentionMatches.map(m => m.slice(1).toLowerCase()))] : [];

    const post = await Post.create({
      author: author._id,
      text: p.text,
      image: p.image,
      hashtags,
      mentions,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      createdAt,
      updatedAt: createdAt,
    });
    createdPosts.push(post);
  }

  console.log('Adding realistic likes, comments, bookmarks and notifications...');
  const allUserList = Object.values(userMap);

  const sampleComments = [
    'Totally agree with this! Well said.',
    'This looks super clean and inspiring! 🔥',
    'Adding this to my reading list right away.',
    'What a great perspective, thanks for sharing!',
    'The aesthetic in this photo is unbelievable.',
    'Could not have explained it better myself.',
    'Bookmarked for my team discussion tomorrow.',
    'Bangalore tech scene in a nutshell! 😄',
    'Chai + code is the ultimate cheat code.',
  ];

  let totalComments = 0;
  let totalLikes = 0;
  let totalNotifs = 0;

  for (let idx = 0; idx < createdPosts.length; idx++) {
    const post = createdPosts[idx];

    // Assign 2 to 6 likes per post
    const likeCount = (idx % 5) + 2;
    const shuffledUsers = [...allUserList].sort(() => 0.5 - Math.random());
    const likers = shuffledUsers.slice(0, likeCount);

    for (const liker of likers) {
      post.likes.push(liker._id);
      totalLikes++;

      // Create notification if liker is not author
      if (liker._id.toString() !== post.author.toString()) {
        await Notification.create({
          recipient: post.author,
          actor: liker._id,
          type: 'like',
          post: post._id,
          createdAt: post.createdAt,
        });
        totalNotifs++;
      }
    }
    post.likesCount = post.likes.length;

    // Add 1 to 3 comments for every other post
    if (idx % 2 === 0) {
      const numComments = (idx % 3) + 1;
      for (let c = 0; c < numComments; c++) {
        const commenter = shuffledUsers[(c + 1) % shuffledUsers.length];
        const commentText = sampleComments[(idx + c) % sampleComments.length];

        await Comment.create({
          post: post._id,
          author: commenter._id,
          text: commentText,
          createdAt: new Date(post.createdAt.getTime() + (c + 1) * 3600000),
        });
        totalComments++;

        // Notify post author
        if (commenter._id.toString() !== post.author.toString()) {
          await Notification.create({
            recipient: post.author,
            actor: commenter._id,
            type: 'comment',
            post: post._id,
            createdAt: post.createdAt,
          });
          totalNotifs++;
        }
      }
      post.commentsCount = numComments;
    } else {
      post.commentsCount = 0;
    }

    // Bookmark first 3 posts for demo user
    if (idx < 3) {
      demoUser.bookmarks.push(post._id);
    }

    await post.save();
  }

  await demoUser.save();

  console.log('Seeding completed successfully!');
  console.log(`Summary:`);
  console.log(`- Users created: ${usersData.length}`);
  console.log(`- Posts created: ${createdPosts.length}`);
  console.log(`- Comments created: ${totalComments}`);
  console.log(`- Likes added: ${totalLikes}`);
  console.log(`- Notifications created: ${totalNotifs}`);
  console.log(`Demo login: demo@sangam.in (Password: Demo@123)`);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
