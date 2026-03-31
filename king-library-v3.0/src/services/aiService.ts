export async function generateStudyMaterial(input: string, action: "quiz" | "summary" | "flashcards" | "explanation") {
  const apiKey = process.env.DEEPSEEK_API_KEY || "";
  const model = "deepseek-chat";
  
  let prompt = "";
  switch (action) {
    case "quiz":
      prompt = `Generate a structured multiple-choice quiz based on the following notes. Include 5 questions with 4 options each and indicate the correct answer. Format as JSON.\n\nNotes: ${input}`;
      break;
    case "summary":
      prompt = `Provide a structured, concise summary of the following notes. Use bullet points and bold key terms.\n\nNotes: ${input}`;
      break;
    case "flashcards":
      prompt = `Create a set of 10 digital flashcards (Question/Answer pairs) based on these notes. Format as JSON.\n\nNotes: ${input}`;
      break;
    case "explanation":
      prompt = `Explain the core concepts in these notes as if I am a beginner. Use analogies where helpful.\n\nNotes: ${input}`;
      break;
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a helpful study assistant." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate content from DeepSeek");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating ${action}:`, error);
    throw error;
  }
}
