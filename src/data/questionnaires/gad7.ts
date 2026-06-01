import type { QuestionnaireDefinition } from "./types";

export const gad7: QuestionnaireDefinition = {
  id: "gad-7",
  title: "GAD-7",
  subtitle: "Generalized Anxiety Disorder scale",
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
    { id: "gad1", text: "Feeling nervous, anxious, or on edge" },
    { id: "gad2", text: "Not being able to stop or control worrying" },
    { id: "gad3", text: "Worrying too much about different things" },
    { id: "gad4", text: "Trouble relaxing" },
    { id: "gad5", text: "Being so restless that it is hard to sit still" },
    { id: "gad6", text: "Becoming easily annoyed or irritable" },
    { id: "gad7", text: "Feeling afraid, as if something awful might happen" },
  ],
};
