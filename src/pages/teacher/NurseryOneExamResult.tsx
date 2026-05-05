import NurseryExamResultTemplate from "@/components/teacher/NurseryExamResultTemplate";

const NURSERY_ONE_SUBJECTS = [
  "Numeracy",
  "Literacy",
  "Poems/Rhymes",
  "Social Habits",
  "Hygiene",
  "Health Habits",
  "Colouring",
  "Craft",
  "Practical Life",
  "Sensorial",
];

const NurseryOneExamResult = () => (
  <NurseryExamResultTemplate
    classLabel="Nursery One"
    classLabelUpper="NURSERY ONE"
    defaultSubjects={NURSERY_ONE_SUBJECTS}
  />
);

export default NurseryOneExamResult;