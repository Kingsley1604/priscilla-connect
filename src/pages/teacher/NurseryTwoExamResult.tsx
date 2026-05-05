import NurseryExamResultTemplate from "@/components/teacher/NurseryExamResultTemplate";

const NURSERY_TWO_SUBJECTS = [
  "Numeracy",
  "Literacy",
  "Dictation",
  "Poems/Rhymes",
  "Social Habits",
  "Hygiene",
  "Health Habits",
  "Colouring",
  "Craft",
  "Practical Life",
  "Sensorial",
];

const NurseryTwoExamResult = () => (
  <NurseryExamResultTemplate
    classLabel="Nursery Two"
    classLabelUpper="NURSERY TWO"
    defaultSubjects={NURSERY_TWO_SUBJECTS}
  />
);

export default NurseryTwoExamResult;