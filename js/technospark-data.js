/* ============================================================
   TECHNOSPARK 2K26 - CENTRALIZED CONFIGURATION & DATA
   ============================================================ */

// Single source of truth for the TechnoSpark registration link
const TECHNOSPARK_REGISTRATION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeX9KqWief9RfUxIGEn-XeJoLq5yaL6dIb-l7nqhUW5osJu3A/viewform";

const GAMES_DATA = {
  indoor: [
    {
      id: 'technical-sessions', name: 'Technical Sessions', desc: 'Learn, build, and explore emerging technologies', isTeam: false,
      info: { participants: '--', format: 'Sessions available on either day or both days', fee: '₹20 for any one day session / ₹30 for both day sessions', speakerDetails: '--', venue: '--', date: '29th & 30th Sept', time: '--', eligibility: '--', important: '--' }
    },
    {
      id: 'cyberescape', name: 'Cyber Escape Room', desc: 'Solve puzzles to break out', isTeam: true,
      info: { participants: '--', teamSize: '--', format: '--', fee: '₹120', prize: '₹1500', venue: '--', date: '29th Sept', time: '--', eligibility: '--', important: '--' }
    },
    {
      id: 'treasurehunt', name: 'Tech Treasure', desc: 'Follow the clues, find the tech', isTeam: true,
      info: { participants: '--', teamSize: '--', format: '--', fee: '₹120', prize: '₹1500', venue: '--', date: '30th Sept', time: '--', eligibility: '--', important: '--' }
    },
    {
      id: 'freefire', name: 'Free Fire', desc: 'Squad up and survive', isTeam: true,
      info: { participants: '--', teamSize: '--', format: '--', fee: '₹160', prize: '₹1500', venue: '--', date: '29th & 30th Sept', time: '--', eligibility: '--', important: '--' }
    },
    {
      id: 'chess', name: 'Chess', desc: 'Strategic battle of minds', isTeam: false,
      info: { participants: '--', format: '--', fee: '₹50', prize: '₹1500', venue: '--', date: '29th & 30th Sept', time: '--', eligibility: '--', important: '--' }
    }
  ],
  outdoor: [
    {
      id: 'boxcricket', name: 'Box Cricket', desc: 'Fast-paced cricket action', isTeam: true,
      info: { participants: '--', teamSize: '--', format: '--', fee: '₹300', prize: '₹3000', venue: '--', date: '29th Sept', time: '--', eligibility: '--', important: '--' }
    },
    {
      id: 'tugofwar', name: 'Tug of War', desc: 'Show your strength and teamwork', isTeam: true,
      info: { participants: '--', teamSize: '--', format: '--', fee: '₹100', prize: '₹1000', venue: '--', date: '29th Sept', time: '--', eligibility: '--', important: '--' }
    },
    {
      id: 'boxfootball', name: 'Football', desc: 'Show your skills in the box', isTeam: true,
      info: { participants: '--', teamSize: '--', format: '--', fee: '₹100', prize: '₹700', venue: '--', date: '30th Sept', time: '--', eligibility: '--', important: '--' }
    },
    {
      id: 'badminton', name: 'Badminton', desc: 'Smash your way to victory', isTeam: false,
      info: { participants: '--', format: '--', fee: '₹40', prize: '₹600', venue: '--', date: '30th Sept', time: '--', eligibility: '--', important: '--' }
    }
  ]
};

const TECHNOSPARK_SCHEDULE = [
  { day: 'DAY 1', date: '29th September 2026', events: 'Cyber Escape Room, Box Cricket, Tug of War, Free Fire, Chess' },
  { day: 'DAY 2', date: '30th September 2026', events: 'Tech Treasure, Football, Badminton, Free Fire, Chess' }
];

const TECHNOSPARK_FAQ = [
  { question: "Who can participate?", answer: "Details will be updated soon." },
  { question: "How do I register?", answer: "Details will be updated soon." },
  { question: "What events are available?", answer: "Details will be updated soon." },
  { question: "Are team events available?", answer: "Details will be updated soon." },
  { question: "Where will the event take place?", answer: "Details will be updated soon." },
  { question: "When is TechnoSpark?", answer: "29 & 30 September 2026." }
];

const TECHNOSPARK_CONTACT = [
  { role: "Organizer", name: "--", email: "--", phone: "--", social: "--" }
];
