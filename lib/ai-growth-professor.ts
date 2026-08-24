export type GrowthProfessorContext = {
  major: string;
  interests: string[];
  careerConcerns: string[];
  project: {
    title: string;
    question: string;
    firstAction: string;
  } | null;
  professor: {
    name: string;
    department: string;
    reason: string;
  } | null;
};
export type GrowthProfessorMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GrowthProfessorRequest = {
  context: GrowthProfessorContext;
  messages: GrowthProfessorMessage[];
};

export type GrowthProfessorResponse = {
  reply: string;
  reflection: {
    title: string;
    body: string;
  };
  suggestedPrompts: [string, string, string];
  generatedAt: string;
  model: string;
};
