
export type ActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export const initialState: ActionState = {
  success: false,
  message: "",
};