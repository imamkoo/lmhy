import type { QuestionnaireDefinition } from "./types";

export const dass21: QuestionnaireDefinition = {
  id: "dass-21",
  title: "DASS-21",
  subtitle: "Depression Anxiety Stress Scales",
  descriptionEn:
    "Please read each statement and select how much the statement applied to you over the past week.",
  scaleType: "likert-4",
  scaleLabels: [
    "Did not apply to me at all",
    "Applied to me to some degree, or some of the time",
    "Applied to me to a considerable degree, or a good part of time",
    "Applied to me very much, or most of the time",
  ],
  questions: [
    { id: "d1", text: "I found it hard to wind down" },
    { id: "d2", text: "I was aware of dryness of my mouth" },
    { id: "d3", text: "I couldn't seem to experience any positive feeling at all" },
    { id: "d4", text: "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)" },
    { id: "d5", text: "I found it difficult to work up the initiative to do things" },
    { id: "d6", text: "I tended to over-react to situations" },
    { id: "d7", text: "I experienced trembling (e.g. in the hands)" },
    { id: "d8", text: "I felt that I was using a lot of nervous energy" },
    { id: "d9", text: "I was worried about situations in which I might panic and make a fool of myself" },
    { id: "d10", text: "I felt that I had nothing to look forward to" },
    { id: "d11", text: "I found myself getting agitated" },
    { id: "d12", text: "I found it difficult to relax" },
    { id: "d13", text: "I felt down-hearted and blue" },
    { id: "d14", text: "I was intolerant of anything that kept me from getting on with what I was doing" },
    { id: "d15", text: "I felt I was close to panic" },
    { id: "d16", text: "I was unable to become enthusiastic about anything" },
    { id: "d17", text: "I felt I wasn't worth much as a person" },
    { id: "d18", text: "I felt that I was rather touchy" },
    { id: "d19", text: "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)" },
    { id: "d20", text: "I felt scared without any good reason" },
    { id: "d21", text: "I felt that life was meaningless" },
  ],
};
