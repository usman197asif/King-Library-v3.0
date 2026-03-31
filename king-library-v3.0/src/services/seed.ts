import { createGig } from "./gigService";

export async function seedGigs() {
  const gigs = [
    {
      title: "Biology Lab Report Review",
      desc: "Review and proofread a 5-page lab report on cellular respiration.",
      payout: "$20",
      deadline: "24h",
      category: "Writing",
      tags: ["Biology", "Writing"]
    },
    {
      title: "Python Script Debugging",
      desc: "Help debug a data processing script for a research project.",
      payout: "$45",
      deadline: "12h",
      category: "STEM",
      tags: ["STEM", "Code"],
      premium: true
    },
    {
      title: "History Essay Outline",
      desc: "Create a detailed outline for a 2000-word essay on the Industrial Revolution.",
      payout: "$15",
      deadline: "2 days",
      category: "Research",
      tags: ["History", "Research"]
    },
    {
      title: "Advanced Calculus Tutoring",
      desc: "1-hour session covering multi-variable integration techniques.",
      payout: "$60",
      deadline: "Today",
      category: "STEM",
      tags: ["Math", "Tutoring"],
      premium: true
    },
    {
      title: "Graphic Design for Poster",
      desc: "Design a scientific poster for a chemistry symposium.",
      payout: "$35",
      deadline: "3 days",
      category: "Creative",
      tags: ["Creative", "Science"]
    },
    {
      title: "Literature Review Summary",
      desc: "Summarize 5 academic papers on modernism in 20th-century literature.",
      payout: "$25",
      deadline: "1 day",
      category: "Research",
      tags: ["English", "Research"]
    }
  ];

  for (const gig of gigs) {
    await createGig(gig, "system-admin");
  }
  console.log("Gigs seeded successfully!");
}
