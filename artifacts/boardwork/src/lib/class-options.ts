export const GRADE_OPTIONS = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "College / Adult",
] as const;

export const SUBJECT_OPTIONS = [
  "Design",
  "Science",
  "Math",
  "English / Language Arts",
  "Social Studies / Humanities",
  "World Languages",
  "Art",
  "Music",
  "Computer Science",
  "Other / Custom",
] as const;

export const CURRICULUM_OPTIONS = [
  "IB MYP",
  "NGSS",
  "Common Core",
  "AP",
  "Other / Custom",
  "None / Not specified",
] as const;

export const CLASS_COLOR_OPTIONS = [
  { value: "#64748B", label: "Slate" },
  { value: "#52739D", label: "Blue" },
  { value: "#3F7C7B", label: "Teal" },
  { value: "#5F7A55", label: "Green" },
  { value: "#9A7B3F", label: "Amber" },
  { value: "#A46643", label: "Clay" },
  { value: "#9A5F63", label: "Rose" },
  { value: "#80627F", label: "Plum" },
  { value: "#69678D", label: "Violet" },
] as const;