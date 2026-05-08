export const BRAND = {
  name: 'PURE X',
  tagline: 'Train for Life. Not Just Aesthetics.',
  whatsapp: '+447778899345',
  email: 'contact.teampurex@gmail.com', // public-facing email
  internalEmail: 'info.teampurex@gmail.com', // internal/admin notifications
  locations: ['India', 'UK'],
} as const;

export const whatsappLink = (message = 'Hi PURE X, I would like to know more.') =>
  `https://wa.me/${BRAND.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

// Fallback data — used before Supabase is wired. Admin panel will replace with DB reads.
export const FALLBACK_EXPERTS = [
  {
    slug: 'siva-reddy',
    name: 'Siva Reddy',
    title: 'Co-Founder & Personal Training Head',
    shortRole: 'PT Head',
    bioShort:
      'ICN medalist and architect of every PURE X training programme. Engineer-turned-coach with 300+ clients coached across strength, HYROX, rehab, and athletic performance.',
    credentials: [
      'ICN Gold 2024 — Best Transformation',
      'ICN Bronze 2024 — Men\'s Fitness Model',
      'Powerlifting Trainer (INPTA)',
      'Injury Rehabilitation Trainer',
      'Diploma in Personal Training',
      'Diploma in Nutrition',
    ],
    specialisms: [
      'HYROX Training',
      'Strength & Powerlifting',
      'Fat Loss',
      'Injury Rehab',
      'Calisthenics',
      'Post-Pregnancy Recovery',
    ],
    yearsExperience: 5,
    clientsTrained: 300,
    location: 'India',
    photoUrl: '/experts/siva-reddy.jpg',
    stat: { num: '300+', label: 'Clients Coached' },
    bioLong: [
      'Siva Reddy is the architectural force behind every PURE X training programme. As Personal Training Head, he leads the design and evolution of structured, performance-driven systems—ensuring every client experiences scientifically grounded and result-oriented training.',
      'His journey into fitness began through personal transformation. With a background in Electronics and Communications Engineering, Siva started in the corporate world, where stress and lifestyle challenges affected his health. This became the turning point that led him to rebuild his life through disciplined training and structured habits.',
      'Through consistency and focused programming, Siva achieved a 40kg weight loss, transforming both his physique and mindset. His journey led him to the competitive stage, earning a Gold Medal in Best Transformation and Bronze in Men\'s Fitness Model at ICN 2024.',
      'Driven by purpose, he transitioned fully into the fitness industry and now holds multiple professional certifications aligned with INPTA and ISO standards. Having coached 300+ clients across fat loss, muscle building, hormonal balance, post-pregnancy recovery, injury rehabilitation, and calisthenics, Siva blends technical precision with real-world adaptability.',
      'More than a coach, he is a system builder—creating structured pathways that help individuals become stronger, healthier, and more capable for life.',
    ],
    responsibilities: [],
  },
  {
    slug: 'chandralekha',
    name: 'Chandralekha',
    title: 'Consultant Doctor',
    shortRole: 'Doctor',
    bioShort:
      'Consultant doctor bringing real clinical rigour to every PURE X programme. Turns fitness into medically supervised health transformation.',
    credentials: [
      'Pre-programme Medical Screening',
      'Cardiovascular & Metabolic Health',
      'Risk Stratification',
      '7+ Years Clinical Experience',
    ],
    specialisms: [
      'Medical Screening',
      'Cardiovascular Health',
      'Metabolic Assessment',
      'Chronic Condition Management',
      'Sustainable Health Habits',
    ],
    yearsExperience: 7,
    location: 'India',
    photoUrl: '/experts/chandralekha.jpg',
    stat: { num: '100%', label: 'Medical Clearance' },
    bioLong: [
      'Chandralekha plays a key role in strengthening the PURE X approach through education and awareness, bringing a strong medical perspective to health, recovery, and safe training practices. Her contribution supports the transition from traditional fitness to a more informed and sustainable approach to overall well-being.',
      'With extensive clinical experience, she brings a deep understanding of patient care, health monitoring, and lifestyle-related conditions. Her insights help individuals approach fitness with greater clarity, safety, and long-term focus.',
      'Beyond her professional work, Chandralekha is also a mother of two, balancing career and family life. This gives her a practical understanding of the challenges many individuals face — including time constraints, stress, and the need for realistic, sustainable health solutions.',
      'Her approach aligns closely with the PURE X philosophy — focusing not just on fitness, but on building safe, consistent, and long-term lifestyle transformation.',
    ],
    responsibilities: [],
  },
  {
    slug: 'krishna',
    name: 'Krishna',
    title: 'Physiotherapist',
    shortRole: 'Physio',
    bioShort:
      'Prevention-first physiotherapy embedded into training from day one. 1,000+ clients treated, backed by 5+ years of hands-on clinical experience.',
    credentials: [
      'Certified Physiotherapist',
      'Rehabilitation Specialist',
      'Movement Screening Expert',
      '5+ Years Clinical Experience',
    ],
    specialisms: [
      'Injury Prevention',
      'Movement Screening',
      'Rehabilitation',
      'Mobility & Soft Tissue',
      'Return-to-Training Protocols',
      'Corrective Exercise',
    ],
    yearsExperience: 5,
    clientsTrained: 1000,
    location: 'India',
    photoUrl: '/experts/krishna.jpg' as string | null,
    stat: { num: '1000+', label: 'Clients Treated' },
    bioLong: [
      'Krishna plays a critical role in ensuring that every PURE X client moves efficiently, recovers effectively, and trains consistently without setbacks. As the Physiotherapist, he brings a proactive, prevention-first approach that is deeply integrated into the PURE X training system.',
      'With over 5 years of professional experience and having supported 1,000+ clients, Krishna brings extensive hands-on expertise in injury prevention, rehabilitation, and movement optimisation. His work focuses not just on treating injuries, but on identifying and correcting the root causes before they become limitations.',
      'He holds professional certification in physiotherapy and rehabilitation, reinforcing his ability to deliver structured, evidence-based recovery and injury management solutions.',
      'His approach aligns with the PURE X philosophy — integrating physiotherapy into training from day one, rather than treating it as a reactive service. By combining clinical knowledge with real-world application, Krishna ensures that clients can train safely, progress consistently, and build long-term physical resilience.',
    ],
    responsibilities: [],
  },
  {
    slug: 'siva-jampana',
    name: 'Siva Jampana',
    title: 'Co-Founder & Operations Head',
    shortRole: 'Co-Founder',
    bioShort:
      'Co-founder driving the PURE X vision. Endurance athlete, lifestyle coach, and HYROX Pro Doubles competitor delivering the client experience end-to-end.',
    credentials: [
      'MEng Engineering Management (Distinction)',
      'Indo-German Chamber Certified Technical Trainer',
      'HYROX Pro Doubles Competitor',
      'Endurance & Resilience Training',
      'Lifestyle Coaching',
    ],
    specialisms: [
      'Client Experience',
      'Programme Delivery',
      'HYROX Performance',
      'Endurance Training',
      'Lifestyle Coaching',
      'Operational Excellence',
    ],
    yearsExperience: 15,
    clientsTrained: 10000,
    location: 'UK',
    photoUrl: '/experts/siva-jampana.jpg',
    stat: { num: 'HYROX', label: 'Pro Doubles' },
    bioLong: [
      'Siva Jampana drives the vision behind PURE X, ensuring every client journey is structured, performance-focused, and aligned with long-term lifestyle transformation. His approach combines systems thinking with real-world experience to deliver a consistent and premium training ecosystem.',
      'With a background in Mechanical Engineering and experience in the automotive industry, Siva brings strong execution, discipline, and scalable thinking into PURE X. He has trained over 10,000+ professionals and is an Indo-German Chamber of Commerce certified Technical Trainer, reflecting his ability to build structured learning and coaching systems.',
      'His personal journey is deeply rooted in endurance and resilience. Having completed multiple long-distance cycling challenges—including two 1300km rides and a 600km barefoot ride—Siva brings firsthand experience in endurance training and mental discipline. This forms a strong foundation for his focus on hybrid performance and Ironman-style training.',
      'Alongside his practical experience, he is currently advancing his expertise through Personal Training and Nutrition certifications, aligning with the PURE X philosophy of continuous learning and development.',
      'Having transformed his own lifestyle through a 20kg weight loss and competitive HYROX participation, Siva embodies the PURE X mission — building individuals who are stronger, more capable, and prepared for real-life performance.',
    ],
    responsibilities: [],
  },
  {
    slug: 'amber-jasari',
    name: 'Amber Jasari',
    title: 'Mental Health Consultant',
    shortRole: 'Mental',
    bioShort:
      'UK-based, UK-trained mental health consultant. Trauma-informed, person-centred care that brings the mind-body connection into every PURE X plan.',
    credentials: [
      'CPBAB Certified',
      'Trained Mental Health First Aider',
      'Therapeutic Psychology & Counselling',
      'UK Mental Health System Experience',
      'Qualified Mental Health Support Worker',
    ],
    specialisms: [
      'Emotional Resilience',
      'Stress & Anxiety Management',
      'Trauma-Informed Care',
      'Mind-Body Integration',
      'Lifestyle Imbalance Support',
      'Young People & Additional Needs',
    ],
    yearsExperience: 4,
    location: 'UK',
    photoUrl: '/experts/amber-jasari.jpg' as string | null,
    stat: { num: 'UK', label: 'UK Trained' },
    bioLong: [
      'Amber Jasari brings a vital dimension to the PURE X ecosystem — mental and emotional well-being. Based in London, she has completed her education in the United Kingdom, where mental health care is highly prioritised and structured around evidence-based, person-centred practices.',
      'With a background in Therapeutic Psychology and Counselling, Amber offers a compassionate and supportive space for individuals looking to improve their mental and overall well-being. Her approach is rooted in holistic health and integrative psychotherapy, focusing on the connection between the mind and body.',
      'She works closely with clients to help them build emotional resilience, navigate personal challenges, and create meaningful, lasting change in their lives. Amber is CPBAB certified and a trained Mental Health First Aider and First Aider, with hands-on experience in mental health nursing support and working as a qualified mental health support worker.',
      'She follows a trauma-informed, inclusive, and person-centred approach, ensuring that every client feels understood, respected, and supported. Her goal is to create a calm, safe, and non-judgmental environment where clients feel empowered to explore their thoughts and emotions at their own pace — building awareness, confidence, and long-term emotional resilience.',
    ],
    responsibilities: [],
  },
] as const;

export const FALLBACK_PROGRAMS = [
  {
    slug: 'pure-foundation',
    name: 'Pure Foundation',
    tag: 'Start Here',
    tagline: 'Start with clarity. Build your base.',
    description:
      'Entry-level onboarding to understand your goals, lifestyle, and health — then deliver a structured plan you can actually follow. Clarity and direction before any further commitment.',
    priceInr: 1999,
    priceDisplay: '₹1,999',
    priceSuffix: '',
    durationMonths: 1,
    isFeatured: false,
    isPremium: false,
    inclusions: [
      'Client profiling — goals, lifestyle, health',
      'Personalised workout plan',
      'Diet guidance',
      'Water & sleep targets',
      'Daily schedule',
      'Weight tracking',
      '1 progress call',
    ],
  },
  {
    slug: 'pure-core',
    name: 'Pure Core',
    tag: 'Most Popular',
    tagline: 'Your transformation system begins here.',
    description:
      'The full PURE X transformation system. Accountability, tracking, and consistency delivered through integrated app tracking, doctor and physio access, weekly calls, and real community.',
    priceInr: 4999,
    priceDisplay: '₹4,999',
    priceSuffix: '/month',
    durationMonths: 3,
    isFeatured: true,
    isPremium: false,
    inclusions: [
      'Everything in Foundation',
      'Doctor consultation',
      'Physiotherapy assessment',
      'Full app tracking — steps, meals, water, sleep',
      'Streak system',
      'AI chat support',
      'Weekly progress calls',
      'Challenges & competitions',
    ],
  },
  {
    slug: 'pure-elite',
    name: 'Pure Elite',
    tag: 'Performance',
    tagline: 'Train like an athlete. Live like one.',
    description:
      'Premium performance and lifestyle membership. 1-on-1 coaching, HYROX and Ironman preparation, outdoor sessions, weekly expert access, and full club & community membership.',
    priceInr: 19999,
    priceDisplay: '₹19,999',
    priceSuffix: '/month',
    durationMonths: 6,
    isFeatured: false,
    isPremium: false,
    inclusions: [
      'Everything in Core',
      '1-on-1 performance training',
      'HYROX / Ironman / Marathon prep',
      'Weekly outdoor training sessions',
      'PURE X club & community access',
      'Weekly expert access (Doctor / Physio / Mental Health)',
      'Advanced performance tracking',
      'Competition readiness',
    ],
  },
  {
    slug: 'enduro',
    name: 'Pure Enduro',
    tag: 'Race Prep',
    tagline: 'For HYROX, IRONMAN, and hybrid athletes built for the long event.',
    description:
      'A specialist programme for athletes preparing for HYROX, IRONMAN, and other endurance events. Combines structured periodisation, race-specific conditioning, and the lived experience of HYROX Pro Doubles competitors. The most demanding programme PURE X offers — and the most rewarding.',
    priceInr: 7499,
    priceDisplay: '₹7,499',
    priceSuffix: '/month',
    durationMonths: 4,
    isFeatured: false,
    isPremium: true,
    inclusions: [
      'Structured race-day preparation (HYROX or IRONMAN)',
      'Periodised training cycles with taper protocols',
      'Strength + endurance hybrid programming',
      'Movement screening + injury prevention',
      'Direct access to Siva Jampana (HYROX Pro Doubles)',
      'Race-day strategy session and equipment check',
      'Race-day visualisation and mental preparation protocols',
      'Recovery and nutrition optimised for race demands',
      'Weekly performance reviews with the full team',
      '1-on-1 coaching across all 6 specialists',
    ],
  },
] as const;

export const FALLBACK_TRANSFORMATIONS = [
  {
    slug: 'siva-hybrid-athlete',
    firstName: 'Siva',
    goal: 'Lifestyle → Hybrid Athlete',
    duration: '2 years (sustained)',
    headline: 'From inconsistent fitness to HYROX Pro Doubles. Next stop: IRONMAN.',
    beforeImageUrl: '/transformations/siva-before.jpg',
    afterImageUrl: '/transformations/siva-after.jpg',
    story: [
      "At PURE X, this transformation was never just about weight loss. Siva had achieved weight loss multiple times before. As an active cyclist, he had already completed multiple endurance rides — including two 1300 km cycling events and one 600 km barefoot ride. He knew how to push hard and get results.",
      "But like many people, consistency was the real challenge. Starting strong was never the problem. Staying consistent was. Career pressure, irregular routines, work stress, and balancing responsibilities often led to phases where progress would eventually reset.",
      "That changed when we shifted the focus from motivation to systems. We didn't rush the process — we built it step by step: daily activity and movement consistency, structured strength training, nutrition discipline, sleep and recovery optimisation, sustainable habit building.",
      "Over time, fitness stopped being a temporary phase and became a lifestyle. For the first time, the transformation sustained. 2 years. Consistent. And the impact went far beyond physique — improved discipline, better focus and productivity, growth in career and personal life, increased strength and athletic performance.",
      "What started as a lifestyle transformation gradually evolved into hybrid athletic performance. Today, Siva has progressed into HYROX Pro Doubles participation in Bangkok, strength and endurance-focused training, hybrid conditioning, and long-term athletic development. And now, his next goal is preparing for IRONMAN.",
      "This is what PURE X is built on. Not quick results. Not temporary motivation. But systems that create lasting transformation, sustainable performance, and stronger lifestyles."
    ],
  },
  {
    slug: 'sravya-hormonal-balance',
    firstName: 'Sravya',
    goal: 'Hormonal Balance + Lifestyle',
    duration: '6 months',
    headline: 'When lifestyle changes, health follows.',
    beforeImageUrl: '/transformations/sravya-before.jpg',
    afterImageUrl: '/transformations/sravya-after.jpg',
    story: [
      "Sravya came to PURE X during a phase where work pressure, stress, poor sleep, and inconsistent lifestyle habits had started affecting her overall health.",
      "As a busy business development professional living in Dubai, balancing career demands often meant neglecting nutrition, recovery, and personal well-being. Over time, this led to increased stress, hormonal imbalance, lifestyle-related health concerns, and elevated HbA1c markers.",
      "At PURE X, the focus was never on extreme dieting or rapid weight loss. Instead, we introduced a structured system built around daily accountability, strength training, nutrition guidance, sleep and recovery tracking, and sustainable lifestyle changes.",
      "Over six months, through consistency and gradual habit-building, Sravya achieved significant improvements in overall fitness, energy levels, hormonal health, lifestyle balance, and HbA1c markers.",
      "But beyond the physical transformation, the biggest change was regaining confidence, structure, and control over her health again. PURE X focuses on building sustainable systems — not temporary results."
    ],
  },
  {
    slug: 'jay-everest-prep',
    firstName: 'Jay',
    goal: 'Body Recomp + Everest Prep',
    duration: 'Ongoing',
    headline: 'The goal wasn\u2019t just aesthetics. It was becoming capable of bigger challenges.',
    beforeImageUrl: '/transformations/jay-before.jpg',
    afterImageUrl: '/transformations/jay-after.jpg',
    story: [
      "Jay's goal was never just to \u201cwork out.\u201d As an entrepreneur and social influencer, he always wanted to stay fit, look athletic, and build a body that reflected the discipline and lifestyle he envisioned for himself.",
      "But beyond aesthetics, he had a bigger dream: climbing Mount Everest.",
      "Before joining PURE X, Jay had already trained at multiple gyms and with different programs. Like many people, he stayed active — but never truly felt satisfied with his progress or physique transformation. The issue was not effort. The issue was direction, structure, and consistency.",
      "At PURE X, we shifted the focus from random workouts to a performance-driven transformation system: structured strength training, body recomposition, athletic conditioning, nutrition discipline, recovery optimisation, sustainable consistency.",
      "Over time, Jay transformed from a normal fitness lifestyle into a noticeably stronger and more aesthetic physique. Improved muscle definition, better overall conditioning, increased strength and athleticism, more confidence and physical presence, a stronger foundation for future endurance goals.",
      "Most importantly, his fitness journey became purposeful and performance-oriented. Today, the goal is no longer just looking fit. It's building the physical and mental capability required for bigger challenges — including his long-term dream of climbing Everest.",
      "This reflects the PURE X philosophy: fitness should not only change how you look, but expand what you are capable of achieving."
    ],
  },
  {
    slug: 'maneesh-strength-recomp',
    firstName: 'Maneesh',
    goal: 'Strength + Body Recomp',
    duration: 'Sustained progression',
    headline: 'From inconsistent habits to a stronger, sustainable lifestyle.',
    beforeImageUrl: '/transformations/maneesh-before.jpg',
    afterImageUrl: '/transformations/maneesh-after.jpg',
    story: [
      "Maneesh's transformation started with a common struggle faced by many young professionals — lack of structure, inconsistent habits, and gradual weight gain.",
      "Long work hours, irregular eating patterns, poor sleep, and an unbalanced routine slowly impacted both his physique and confidence. At one point, fitness felt overwhelming and difficult to sustain consistently.",
      "At PURE X, the focus was not simply on losing weight. The goal was to help him build strength, improve body composition, develop consistency, and create a sustainable lifestyle.",
      "Through structured training, progressive strength building, nutrition guidance, and daily accountability, Maneesh gradually transformed from an unhealthy and inactive lifestyle into a stronger, more aesthetic version of himself.",
      "His transformation resulted in significant fat loss, visible muscle development, increased overall strength, better posture and confidence, and improved lifestyle discipline.",
      "More importantly, the transformation was sustainable because it was built step by step — through systems, consistency, and long-term habit change. This is what PURE X stands for: not temporary weight loss, but building stronger bodies and sustainable lifestyles."
    ],
  },
  {
    slug: 'sasa-marathon-runner',
    firstName: 'Sasa',
    goal: 'Fat Loss → Endurance',
    duration: 'Ongoing',
    headline: '15 kg lost. Half marathon completed. Full marathon next.',
    beforeImageUrl: '/transformations/sasa-before.jpg',
    afterImageUrl: '/transformations/sasa-after.jpg',
    story: [
      "For Sasa, life in the United Kingdom slowly started affecting his health and routine. Over time, weight gain, low energy, and lack of structure started impacting both his physical and mental confidence. That's when the PURE X journey started.",
      "Instead of extreme dieting or unrealistic gym routines, the focus became building sustainable habits, improving daily activity, structured strength training, better nutrition consistency, and improving endurance step by step.",
      "The goal was not just fat loss. It was helping Sasa build a stronger lifestyle while adapting to student life abroad.",
      "Over time, the transformation became remarkable: nearly 15 kg weight loss, significant strength improvement, better endurance and conditioning, increased confidence and discipline, sustainable fitness lifestyle.",
      "What started as a fat loss journey gradually evolved into athletic performance training. Today, Sasa has successfully completed a Half Marathon and is now training for his Full Marathon goal.",
      "His transformation reflects an important PURE X belief: fitness is not about perfection. It's about building systems that help people perform better in real life — no matter where they start."
    ],
  },
] as const;

export const FALLBACK_FAQS = [
  {
    category: 'Booking',
    question: 'How do I start with PURE X?',
    answer: 'Book a free 30-minute discovery call. We\'ll understand your goals, health history, and recommend the right programme. Your onboarding starts within 7-10 days.',
  },
  {
    category: 'Booking',
    question: 'Can I train online or does it have to be in-person?',
    answer: 'Both. Our Pure Core plan gives you app tracking, weekly calls, and remote doctor and physio access from anywhere. In-person 1-on-1 training is available on Pure Elite and Elite Couple plans in Hyderabad.',
  },
  {
    category: 'Pricing',
    question: 'Why is PURE X more expensive than a regular personal trainer?',
    answer: 'You\'re not hiring one person. You get a trainer, doctor, physiotherapist, and athletic coach working from one coordinated plan. The price reflects an integrated team, not a solo coach.',
  },
  {
    category: 'Training',
    question: 'Do I need prior gym experience?',
    answer: 'No. We start every client with a full medical and physiotherapy screen, then design the programme around their current fitness level. Beginners and experienced athletes both start with a personalised baseline.',
  },
  {
    category: 'Medical',
    question: 'What if I have an injury or medical condition?',
    answer: 'Our consultant doctor conducts a full health screen before training begins. Krishna (physiotherapist) designs corrective work around any limitations. Many of our most successful clients came to us with existing injuries.',
  },
  {
    category: 'HYROX',
    question: 'Do you coach HYROX specifically?',
    answer: 'Yes. Siva Reddy is HYROX-certified and Siva Jampana has competed in HYROX Pro Doubles. We have structured 16-week HYROX preparation cycles for individuals and couples.',
  },
] as const;

export type Expert = typeof FALLBACK_EXPERTS[number];
export type Program = typeof FALLBACK_PROGRAMS[number];
export type Transformation = typeof FALLBACK_TRANSFORMATIONS[number];
export type FaqItem = typeof FALLBACK_FAQS[number];
