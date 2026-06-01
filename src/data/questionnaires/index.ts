import { phq9 } from "./phq9";
import { gad7 } from "./gad7";
import { dass21 } from "./dass21";
import { srq29 } from "./srq29";
import type { QuestionnaireDefinition } from "./types";

export const questionnaires: Record<
  QuestionnaireDefinition["id"],
  QuestionnaireDefinition
> = {
  "phq-9": phq9,
  "gad-7": gad7,
  "dass-21": dass21,
  "srq-29": srq29,
};

export const questionnaireList = Object.values(questionnaires);

export function getQuestionnaire(id: string): QuestionnaireDefinition | null {
  return questionnaires[id as QuestionnaireDefinition["id"]] ?? null;
}

export type { QuestionnaireDefinition };
