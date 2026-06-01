import type { QuestionnaireDefinition } from "./types";

export const phq9: QuestionnaireDefinition = {
  id: "phq-9",
  title: "PHQ-9",
  subtitle: "Patient Health Questionnaire",
  descriptionEn:
    "Over the last 2 weeks, how often have you been bothered by the following problems?",
  scaleType: "likert-4",
  scaleLabels: [
    "Not at all",
    "Several days",
    "More than half the days",
    "Nearly every day",
  ],
  questions: [
    { id: "phq1", text: "Little interest or pleasure in doing things" },
    { id: "phq2", text: "Feeling down, depressed, or hopeless" },
    { id: "phq3", text: "Trouble falling or staying asleep, or sleeping too much" },
    { id: "phq4", text: "Feeling tired or having little energy" },
    { id: "phq5", text: "Poor appetite or overeating" },
    {
      id: "phq6",
      text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    },
    {
      id: "phq7",
      text: "Trouble concentrating on things, such as reading the newspaper or watching television",
    },
    {
      id: "phq8",
      text: "Moving or speaking so slowly that other people could have noticed, or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
    },
    {
      id: "phq9",
      text: "Thoughts that you would be better off dead or of hurting yourself in some way",
    },
  ],
};
