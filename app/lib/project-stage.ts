export const projectStages = ["planning", "initializing", "in_progress", "testing", "on_hold", "completed"] as const;

export type ProjectStage = (typeof projectStages)[number];

export const projectStageLabels: Record<ProjectStage, string> = {
  planning: "Planning",
  initializing: "Initializing",
  in_progress: "In progress",
  testing: "Testing",
  on_hold: "On hold",
  completed: "Completed",
};
