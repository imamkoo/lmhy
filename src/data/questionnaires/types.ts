export type ScaleType = "yes-no" | "likert-4";

export type QuestionnaireDefinition = {
  id: "srq-29" | "dass-21" | "phq-9" | "gad-7";
  title: string;
  subtitle: string;
  descriptionEn: string;
  scaleType: ScaleType;
  scaleLabels: string[];
  questions: { id: string; text: string }[];
};
