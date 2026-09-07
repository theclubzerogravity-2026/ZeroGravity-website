/* ============================================================
   TECHNOSPARK 2K26 - CENTRALIZED CONFIGURATION & DATA
   ============================================================ */

// Single source of truth for the TechnoSpark registration link
const TECHNOSPARK_REGISTRATION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeX9KqWief9RfUxIGEn-XeJoLq5yaL6dIb-l7nqhUW5osJu3A/viewform";

const GAMES_DATA = {
  indoor: [
    {
      id: 'technical-sessions', name: 'Technical Sessions', desc: 'Learn, build, and explore emerging technologies', isTeam: false,
      info: { format: 'Offline / Physical', fee: '₹20 for any one day session / ₹30 for both day sessions', speakerDetails: 'Industry experts from AWS, Google, Microsoft, and other leading MNCs will guide you on emerging technologies, market trends, and placement opportunities.', venue: 'Mechanical Seminar Hall, -2 Floor, Old Building, SKNCOE', date: '29th & 30th Sept', time: '10 AM' }
    },
    {
      id: 'cyberescape', name: 'Cyber Escape Room', desc: 'Solve puzzles to break out', isTeam: true,
      info: { teamSize: '4', format: 'Offline / Physical', fee: '₹120', prize: '₹1500', venue: 'IT Department, Old Building, SKNCOE', date: '29th Sept', time: '10 AM' }
    },
    {
      id: 'treasurehunt', name: 'Tech Treasure', desc: 'Follow the clues, find the tech', isTeam: true,
      info: { teamSize: '4', format: 'Offline / Physical', fee: '₹120', prize: '₹1500', venue: 'IT Department, Old Building, SKNCOE', date: '30th Sept', time: '10 AM' }
    },
    {
      id: 'freefire', name: 'Free Fire', desc: 'Squad up and survive', isTeam: true,
      info: { teamSize: 'Online', format: 'Online', fee: '₹160', prize: '₹1500', venue: 'Online', date: '29th & 30th Sept', time: '10 AM', important: 'Coordinators will provide further instructions.' }
    },
    {
      id: 'chess', name: 'Chess', desc: 'Strategic battle of minds', isTeam: false,
      info: { teamSize: 'Solo', format: 'Offline / Physical', fee: '₹50', prize: '₹1500', venue: 'IT Department, Old Building, SKNCOE', date: '29th & 30th Sept', time: '10 AM' }
    }
  ],
  outdoor: [
    {
      id: 'boxcricket', name: 'Box Cricket', desc: 'Fast-paced cricket action', isTeam: true,
      info: { teamSize: '6', format: 'Offline / Physical', fee: '₹300', prize: '₹3000', venue: 'SKNCOE Parking, In Front of New Building', date: '29th Sept', time: '10 AM' }
    },
    {
      id: 'tugofwar', name: 'Tug of War', desc: 'Show your strength and teamwork', isTeam: true,
      info: { teamSize: '6', format: 'Offline / Physical', fee: '₹100', prize: '₹1000', venue: 'SKNCOE Parking, In Front of New Building', date: '29th Sept', time: '10 AM' }
    },
    {
      id: 'boxfootball', name: 'Football', desc: 'Show your skills in the box', isTeam: true,
      info: { teamSize: '4', format: 'Offline / Physical', fee: '₹100', prize: '₹700', venue: 'SKNCOE Parking, In Front of New Building', date: '30th Sept', time: '10 AM' }
    },
    {
      id: 'badminton', name: 'Badminton', desc: 'Smash your way to victory', isTeam: false,
      info: { teamSize: 'Solo', format: 'Offline / Physical', fee: '₹40', prize: '₹600', venue: 'SKNCOE Parking, In Front of New Building', date: '30th Sept', time: '10 AM' }
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
